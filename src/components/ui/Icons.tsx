import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(props: IconProps) {
  const { size = 18, className, ...rest } = props
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `icone ${className || ''}`.trim(),
    ...rest,
  }
}

export function IconHome(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.7 20c.8-3.2 3.3-5 6.3-5s5.5 1.8 6.3 5" />
      <circle cx="17" cy="8.5" r="2.6" />
      <path d="M16 15.3c2.4.4 4.2 1.9 4.8 4.7" />
    </svg>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.3" y="5" width="17.4" height="15.5" rx="2.5" />
      <path d="M3.3 9.8h17.4" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  )
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.3l1.6 1.6M17.5 16.1l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.7l1.6-1.6M17.5 7.9l1.6-1.6" />
    </svg>
  )
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 16l4-4-4-4" />
      <path d="M14 12H3" />
    </svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 22 20H2z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17h.01" />
    </svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function IconCheckCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3l2.6 2.6 5-5.4" />
    </svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  )
}

export function IconPhone(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 3.5h3l1.5 4-2 1.6a12 12 0 0 0 5.9 5.9l1.6-2 4 1.5v3a1.7 1.7 0 0 1-1.9 1.7A16.5 16.5 0 0 1 4.8 5.4a1.7 1.7 0 0 1 1.7-1.9z" />
    </svg>
  )
}

export function IconCake(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 21v-7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V21" />
      <path d="M4 17h16" />
      <path d="M9 11.5V8M12 11.5V8M15 11.5V8" />
      <path d="M9 5.5c0-1 .7-1.3.7-2S9 2 9 2M12 5.5c0-1 .7-1.3.7-2S12 2 12 2M15 5.5c0-1 .7-1.3.7-2S15 2 15 2" />
    </svg>
  )
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20l.9-4 10-10 3.1 3.1-10 10z" />
      <path d="M13 5.5l3.1 3.1" />
    </svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 7h15" />
      <path d="M9 7V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8V7" />
      <path d="M6.5 7l.8 12.2A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.8L17.5 7" />
    </svg>
  )
}

export function IconExternal(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6H5.5A1.5 1.5 0 0 0 4 7.5v11A1.5 1.5 0 0 0 5.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" />
      <path d="M13.5 4H20v6.5" />
      <path d="M10 14 20 4" />
    </svg>
  )
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconBook(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H12v18H6.2A2.2 2.2 0 0 0 4 23z" />
      <path d="M20 5.2A2.2 2.2 0 0 0 17.8 3H12v18h5.8a2.2 2.2 0 0 1 2.2 2z" />
    </svg>
  )
}

export function IconMessage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5A2.2 2.2 0 0 1 6.2 3.3h11.6A2.2 2.2 0 0 1 20 5.5v8.4a2.2 2.2 0 0 1-2.2 2.2H10l-4.5 3.6v-3.6H6.2A2.2 2.2 0 0 1 4 13.9z" />
    </svg>
  )
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8.3" r="3.6" />
      <path d="M4.5 20c1-3.6 3.8-5.6 7.5-5.6s6.5 2 7.5 5.6" />
    </svg>
  )
}

export function IconArrowLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function IconInbox(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.5" />
      <path d="M4 12.5h4.2l1.2 2.3h5.2l1.2-2.3H20" />
      <path d="M7 12.5 8.6 5A1.7 1.7 0 0 1 10.3 3.6h3.4A1.7 1.7 0 0 1 15.4 5l1.6 7.5" />
    </svg>
  )
}
