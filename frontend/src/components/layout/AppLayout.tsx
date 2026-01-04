import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar, type SidebarItem } from '@/components/layout/Sidebar'

type AppLayoutProps = {
  title: string
  sidebarItems: SidebarItem[]
  children: ReactNode
}

export const AppLayout = ({ title, sidebarItems, children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen w-full">
      <div className="flex min-h-screen w-full flex-col">
        <Header title={title} />

        <div className="flex min-h-0 flex-1">
          <Sidebar items={sidebarItems} />

          <main className="min-w-0 flex-1 bg-amber-50 p-6">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
