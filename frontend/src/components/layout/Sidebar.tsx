import { NavLink, useLocation } from 'react-router-dom';

export type SidebarItem = {
  label: string;
  to: string;
};

type SidebarProps = {
  items: SidebarItem[];
  isOpen?: boolean;
};

export const Sidebar = ({ items, isOpen = true }: SidebarProps) => {
  const location = useLocation();

  const isMaterialsAttemptPath = (pathname: string): boolean => {
    if (pathname === '/materials/attempts') return true;
    return /^\/materials\/[^/]+\/attempts(?:\/.*)?$/.test(pathname);
  };

  const isKanjiAttemptPath = (pathname: string): boolean => {
    if (pathname === '/kanji/attempts') return true;
    return /^\/kanji\/[^/]+\/attempts(?:\/.*)?$/.test(pathname);
  };

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
                  const pathname = location.pathname;

                  let active = isActive;

                  // Avoid double-active on overlapping prefixes.
                  if (item.to === '/materials') {
                    active = isActive && !isMaterialsAttemptPath(pathname);
                  }
                  if (item.to === '/materials/attempts') {
                    active = isMaterialsAttemptPath(pathname);
                  }

                  if (item.to === '/kanji') {
                    active = isActive && !isKanjiAttemptPath(pathname);
                  }
                  if (item.to === '/kanji/attempts') {
                    active = isKanjiAttemptPath(pathname);
                  }

                  return [
                    'block w-full rounded-md px-3 py-2 text-left text-sm',
                    active
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
