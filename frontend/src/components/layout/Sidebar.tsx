import { NavLink } from 'react-router-dom'

export type SidebarItem = {
  label: string
  to: string
}

type SidebarProps = {
  items: SidebarItem[]
}

export function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-amber-200 bg-amber-50">
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
                      ? 'bg-amber-100 font-semibold text-stone-900'
                      : 'text-stone-900 hover:bg-amber-100',
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
