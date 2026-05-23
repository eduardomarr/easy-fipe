import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'

export type ViewType = 'dashboard' | 'history' | 'favorites' | 'settings' | 'users'

const PAGE_META: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral das suas consultas FIPE' },
  history: { title: 'Histórico', subtitle: 'Todas as consultas realizadas' },
  favorites: { title: 'Favoritos', subtitle: 'Veículos salvos como favoritos' },
  settings: { title: 'Configurações', subtitle: 'Preferências do aplicativo' },
  users: { title: 'Usuários', subtitle: 'Gerenciar contas do aplicativo' },
}

interface Props {
  onExitApp: () => void
}

export function AppLayout({ onExitApp }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  function handleToggleCollapse() {
    setCollapsed((c) => !c)
  }

  const segment = location.pathname.split('/').pop() as ViewType
  const { title, subtitle } = PAGE_META[segment] ?? PAGE_META.dashboard

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        onExitApp={onExitApp}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center border-b border-border bg-background/80 px-6 py-4 backdrop-blur-sm">
          <div>
            <h1 className="text-base font-semibold leading-none tracking-tight">{title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
