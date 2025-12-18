type HeaderProps = {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="h-14 shrink-0 border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex h-full w-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">{title}</div>
        </div>
      </div>
    </header>
  )
}
