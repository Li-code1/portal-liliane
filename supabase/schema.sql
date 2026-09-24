-- =====================================================================
-- SCHEMA DO PORTAL DE CLIENTES — Liliane Lima
-- Como usar: no painel do Supabase, vá em "SQL Editor" > "New query",
-- cole todo este arquivo e clique em "Run". Só precisa fazer isso 1 vez.
-- Se você já rodou uma versão anterior deste schema, pode rodar este
-- arquivo de novo tranquilamente — ele só adiciona o que está faltando.
-- =====================================================================

-- 1) Tabela de perfis (um registro por pessoa: você e cada cliente)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  birth_date date,
  is_admin boolean not null default false,
  consentimento_lgpd boolean not null default false,
  consentimento_em timestamptz,
  created_at timestamptz not null default now()
);

-- Se a tabela já existia de uma versão anterior, garante que as colunas novas existem:
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists consentimento_lgpd boolean not null default false;
alter table public.profiles add column if not exists consentimento_em timestamptz;

-- 2) Tabela de metas (uma meta pertence a um cliente)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'em_andamento' check (status in ('em_andamento','concluida')),
  created_at timestamptz not null default now()
);

-- 3) Tabela de ferramentas/materiais (uma ferramenta pertence a um cliente)
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  link text,
  created_at timestamptz not null default now()
);

-- 4) Tabela de sessões (histórico + agenda + feedback do cliente)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  numero integer not null,
  titulo text not null,
  resumo text,
  data_sessao timestamptz not null,
  valor numeric(10,2),
  duracao_minutos integer not null default 60,
  feedback_cliente text,
  feedback_enviado_em timestamptz,
  feedback_autoriza_compartilhar boolean,
  feedback_anonimo boolean,
  lembrete_enviado boolean not null default false,
  created_at timestamptz not null default now()
);

-- Se a tabela já existia de uma versão anterior, garante que as colunas novas existem:
alter table public.sessions add column if not exists lembrete_enviado boolean not null default false;
alter table public.sessions add column if not exists feedback_autoriza_compartilhar boolean;
alter table public.sessions add column if not exists feedback_anonimo boolean;

-- 5) Horários disponíveis para auto-agendamento público (sem precisar de login)
create table if not exists public.available_slots (
  id uuid primary key default gen_random_uuid(),
  data_hora timestamptz not null,
  duracao_minutos integer not null default 60,
  tipo text not null default 'regular' check (tipo in ('regular','cortesia','experimental')),
  status text not null default 'disponivel' check (status in ('disponivel','reservado','cancelado')),
  reservado_nome text,
  reservado_email text,
  reservado_telefone text,
  pagamento_confirmado boolean not null default false,
  reservado_em timestamptz,
  created_at timestamptz not null default now()
);

-- View segura para o público consultar SÓ os horários livres, sem expor
-- nenhum dado de quem já reservou outros horários.
create or replace view public.available_slots_public as
select id, data_hora, duracao_minutos, tipo
from public.available_slots
where status = 'disponivel' and data_hora > now();

-- security_invoker = on: a view passa a rodar com as permissões de quem
-- está consultando (anon/authenticated), respeitando a política de RLS
-- logo abaixo — em vez de rodar com as permissões elevadas de quem criou
-- a view (comportamento padrão do Postgres, que o Security Advisor do
-- Supabase sinaliza como "Security Definer View").
alter view public.available_slots_public set (security_invoker = on);

alter table public.available_slots enable row level security;

-- O público (sem login) só enxerga, via RLS, as linhas com horário
-- disponível e futuro — exatamente os mesmos dados que a view já
-- mostrava antes. A reserva em si continua sendo feita só pela função
-- serverless /api/book-slot (que usa a service_role key, sem passar
-- pelo RLS), então ninguém consegue reservar direto pelo banco.
drop policy if exists "publico_ve_horarios_disponiveis" on public.available_slots;
create policy "publico_ve_horarios_disponiveis" on public.available_slots
  for select
  to anon, authenticated
  using (status = 'disponivel' and data_hora > now());

drop policy if exists "admin_ve_tudo_slots" on public.available_slots;
create policy "admin_ve_tudo_slots" on public.available_slots
  for select using (public.is_admin());

drop policy if exists "admin_gerencia_slots" on public.available_slots;
create policy "admin_gerencia_slots" on public.available_slots
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.available_slots to anon, authenticated;
grant select on public.available_slots_public to anon, authenticated;

-- =====================================================================
-- Trigger: quando você cria um novo usuário no Supabase Auth
-- (você cria pelo painel do Supabase, aba Authentication > Users > Add user),
-- um perfil correspondente é criado automaticamente aqui.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- Função auxiliar para checar se o usuário logado é admin (você)
-- =====================================================================
create or replace function public.is_admin()
returns boolean as $$
  select coalesce((select is_admin from public.profiles where id = (select auth.uid())), false);
$$ language sql security definer stable set search_path = public;

-- =====================================================================
-- Função segura para o CLIENTE enviar feedback de uma sessão.
-- Só atualiza os campos de feedback, e só na própria sessão dele —
-- mesmo que alguém tente chamar isso manualmente, não dá pra alterar
-- título, valor ou data de uma sessão por aqui.
-- =====================================================================
create or replace function public.submit_session_feedback(
  p_session_id uuid,
  p_feedback text,
  p_autoriza_compartilhar boolean default null,
  p_anonimo boolean default null
)
returns void as $$
begin
  update public.sessions
  set feedback_cliente = p_feedback,
      feedback_enviado_em = now(),
      feedback_autoriza_compartilhar = p_autoriza_compartilhar,
      feedback_anonimo = p_anonimo
  where id = p_session_id and client_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- =====================================================================
-- Função segura para o CLIENTE aceitar os termos de privacidade.
-- Só mexe nesses dois campos, na própria conta dele — não dá pra usar
-- isso pra alterar mais nada no perfil.
-- =====================================================================
create or replace function public.accept_privacy_terms()
returns void as $$
begin
  update public.profiles
  set consentimento_lgpd = true, consentimento_em = now()
  where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- =====================================================================
-- Segurança (Row Level Security): cada cliente só vê os próprios dados;
-- você (admin) vê e edita tudo.
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.tools enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "ver_proprio_perfil" on public.profiles;
create policy "ver_proprio_perfil" on public.profiles
  for select using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "admin_atualiza_perfis" on public.profiles;
create policy "admin_atualiza_perfis" on public.profiles
  for update using (public.is_admin());

drop policy if exists "ver_proprias_metas" on public.goals;
create policy "ver_proprias_metas" on public.goals
  for select using (client_id = (select auth.uid()) or public.is_admin());

drop policy if exists "cliente_atualiza_status_propria_meta" on public.goals;
create policy "cliente_atualiza_status_propria_meta" on public.goals
  for update using (client_id = (select auth.uid()) or public.is_admin());

drop policy if exists "admin_insere_metas" on public.goals;
create policy "admin_insere_metas" on public.goals
  for insert with check (public.is_admin());

drop policy if exists "admin_apaga_metas" on public.goals;
create policy "admin_apaga_metas" on public.goals
  for delete using (public.is_admin());

drop policy if exists "ver_proprias_ferramentas" on public.tools;
create policy "ver_proprias_ferramentas" on public.tools
  for select using (client_id = (select auth.uid()) or public.is_admin());

drop policy if exists "admin_insere_ferramentas" on public.tools;
create policy "admin_insere_ferramentas" on public.tools
  for insert with check (public.is_admin());

drop policy if exists "admin_apaga_ferramentas" on public.tools;
create policy "admin_apaga_ferramentas" on public.tools
  for delete using (public.is_admin());

drop policy if exists "ver_proprias_sessoes" on public.sessions;
create policy "ver_proprias_sessoes" on public.sessions
  for select using (client_id = (select auth.uid()) or public.is_admin());

drop policy if exists "admin_insere_sessoes" on public.sessions;
create policy "admin_insere_sessoes" on public.sessions
  for insert with check (public.is_admin());

drop policy if exists "admin_atualiza_sessoes" on public.sessions;
create policy "admin_atualiza_sessoes" on public.sessions
  for update using (public.is_admin());

drop policy if exists "admin_apaga_sessoes" on public.sessions;
create policy "admin_apaga_sessoes" on public.sessions
  for delete using (public.is_admin());

-- =====================================================================
-- ÚLTIMO PASSO (fazer manualmente, uma vez):
-- Depois de criar SEU PRÓPRIO usuário (o da Liliane) em Authentication > Users,
-- rode o comando abaixo trocando o e-mail, para marcar você como admin:
--
-- update public.profiles set is_admin = true where email = 'seu-email-aqui@gmail.com';
-- =====================================================================
