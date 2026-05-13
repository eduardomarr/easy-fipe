import { useState } from 'react'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { HistoryView } from '@/features/history/HistoryView'
import { SettingsView } from '@/features/settings/SettingsView'
import { AppSidebar } from './AppSidebar'

export type ViewType = 'dashboard' | 'history' | 'settings'

const PAGE_META: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral das suas consultas FIPE' },
  history: { title: 'Histórico', subtitle: 'Todas as consultas realizadas' },
  settings: { title: 'Configurações', subtitle: 'Preferências do aplicativo' },
}

interface Props {
  onExitApp: () => void
}

export function AppLayout({ onExitApp }: Props) {
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  function handleToggleCollapse() {
    setCollapsed((c) => !c)
  }

  const { title, subtitle } = PAGE_META[activeView]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        activeView={activeView}
        onNavigate={setActiveView}
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
          {activeView === 'dashboard' && (
            <DashboardView onNavigate={setActiveView} onGoToSearch={onExitApp} />
          )}
          {activeView === 'history' && <HistoryView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  )
}
