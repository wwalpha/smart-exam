import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

type HeaderProps = {
  title: string;
  pageTitle?: string;
  version?: string;
  onToggleSidebar?: () => void;
};

export const Header = ({ title, pageTitle, version, onToggleSidebar }: HeaderProps) => {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-foreground text-background">
      <div className="mx-auto grid h-full w-full grid-cols-3 items-center px-4">
        <div className="flex items-center gap-2">
          {onToggleSidebar ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="メニュー"
              className="h-8 w-8 text-background/90 hover:bg-background/10 hover:text-background"
              onClick={onToggleSidebar}>
              <Menu className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="text-2xl font-semibold text-background/80">{title}</div>
        </div>
        <div className="text-center text-2xl font-semibold text-background">{pageTitle ?? ''}</div>
        <div className="text-right text-sm font-medium text-background/80">{version ?? ''}</div>
      </div>
    </header>
  );
};
