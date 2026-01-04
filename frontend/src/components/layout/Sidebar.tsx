import { NavLink } from 'react-router-dom'

export type SidebarItem = {
  label: string
  to: string
}

type SidebarProps = {
  items: SidebarItem[]
}

export const Sidebar = ({ items }: SidebarProps) => {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-background">
      <nav className="p-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block w-full rounded-md px-3 py-2 text-left text-sm',
                    isActive
                      ? 'bg-accent font-semibold text-accent-foreground'
                      : 'text-foreground hover:bg-accent/50',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
