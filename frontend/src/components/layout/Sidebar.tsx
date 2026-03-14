import { NavLink } from 'react-router-dom';

export type SidebarItem = {
  label: string;
  to?: string;
  isAction?: boolean;
};

type SidebarProps = {
  items: SidebarItem[];
  isOpen?: boolean;
};

export const Sidebar = ({ items, isOpen = true }: SidebarProps) => {
  if (!isOpen) return null;

  const itemClassName = (isActive: boolean): string => {
    return [
      'block w-full rounded-md px-3 py-2 text-left text-base',
      isActive ? 'bg-primary-foreground/15 font-semibold text-primary-foreground' : 'text-primary-foreground hover:bg-primary/90',
    ].join(' ');
  };

  return (
    <aside className="w-44 shrink-0 border-r border-border bg-primary text-primary-foreground">
      <nav className="p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            if (item.isAction && item.to) {
              return (
                <li key={item.label}>
                  <NavLink to={item.to} className={() => itemClassName(false)}>
                    {item.label}
                  </NavLink>
                </li>
              );
            }

            if (!item.to) {
              return null;
            }

            return (
              <li key={item.label}>
                <NavLink to={item.to} className={({ isActive }) => itemClassName(isActive)}>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
