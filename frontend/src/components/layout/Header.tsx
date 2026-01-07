import { Button } from '@/components/ui/button';

type HeaderProps = {
  title: string;
  pageTitle?: string;
  onToggleSidebar?: () => void;
};

export const Header = ({ title, pageTitle, onToggleSidebar }: HeaderProps) => {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-foreground text-background">
      <div className="mx-auto grid h-full w-full grid-cols-3 items-center px-4">
        <div className="flex items-center gap-2">
          {onToggleSidebar ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-background/90 hover:bg-background/10 hover:text-background"
              onClick={onToggleSidebar}>
              メニュー
            </Button>
          ) : null}
          <div className="text-2xl font-semibold text-background/80">{title}</div>
        </div>
        <div className="text-center text-2xl font-semibold text-background">{pageTitle ?? ''}</div>
        <div />
      </div>
    </header>
  );
};
