import { NavLink } from 'react-router-dom';

export type SidebarItem = {
  label: string;
  to: string;
};

type SidebarProps = {
  items: SidebarItem[];
  isOpen?: boolean;
};

export const Sidebar = ({ items, isOpen = true }: SidebarProps) => {
  if (!isOpen) return null;

  return (
    <aside className="w-44 shrink-0 border-r border-border bg-primary text-primary-foreground">
      <nav className="p-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={({ isActive }) => {
                  return [
                    'block w-full rounded-md px-3 py-2 text-left text-sm',
                    isActive
                      ? 'bg-primary-foreground/15 font-semibold text-primary-foreground'
                      : 'text-primary-foreground hover:bg-primary/90',
                  ].join(' ');
                }}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
