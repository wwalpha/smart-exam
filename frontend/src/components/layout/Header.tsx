type HeaderProps = {
  title: string;
  pageTitle?: string;
};

export const Header = ({ title, pageTitle }: HeaderProps) => {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-foreground text-background">
      <div className="mx-auto flex h-full w-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-background/80">{title}</div>
          {pageTitle && <div className="text-sm font-semibold text-background">{pageTitle}</div>}
        </div>
      </div>
    </header>
  );
};
