import { Moon, Sun, Trash2 } from 'lucide-react'
import packageJson from '../../../package.json'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/hooks/useTheme'
import { track } from '@/lib/analytics'
import { useFipeStore } from '@/store/fipeStore'

export function SettingsView() {
  const { theme, toggleTheme } = useTheme()
  const { history, clearHistory } = useFipeStore()

  function handleToggleTheme() {
    toggleTheme()
  }

  function handleClearHistory() {
    track('history_cleared')
    clearHistory()
  }

  return (
    <div className="max-w-lg space-y-5 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tema</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {theme === 'light' ? 'Modo claro ativado' : 'Modo escuro ativado'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleToggleTheme} className="gap-2">
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
              {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Dados</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Histórico de consultas</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {history.length} consulta{history.length !== 1 ? 's' : ''} armazenada
                {history.length !== 1 ? 's' : ''} localmente
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sobre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Versão</p>
            <p className="font-mono text-sm">{packageJson.version}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">API</p>
            <p className="font-mono text-sm">Parallelum FIPE v2</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Dados históricos</p>
            <p className="font-mono text-sm">BrasilAPI</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
