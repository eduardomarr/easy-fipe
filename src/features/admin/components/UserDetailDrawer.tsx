import { Trash2, X } from 'lucide-react'
import type { AdminUser } from '@/api/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  user: AdminUser | undefined
  isLoading: boolean
  isSelf: boolean
  isDeleting: boolean
  onClose: () => void
  onDelete: () => void
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )
}

export function UserDetailDrawer({ user, isLoading, isSelf, isDeleting, onClose, onDelete }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm">Detalhes do usuário</CardTitle>
          {user && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="shrink-0 text-muted-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}
        {!isLoading && user && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="ID">
                <span className="font-mono text-xs break-all">{user.id}</span>
              </Field>
              <Field label="Email">{user.email}</Field>
              <Field label="Nome">{user.fullName ?? '—'}</Field>
              <Field label="Função">
                <Badge variant={user.role === 'admin' ? 'secondary' : 'outline'}>
                  {user.role}
                </Badge>
              </Field>
              <Field label="Notificações por email">
                {user.notificationEmailOptIn ? 'Ativadas' : 'Desativadas'}
              </Field>
              <Field label="Criado em">{formatTimestamp(user.createdAt)}</Field>
              <Field label="Atualizado em">{formatTimestamp(user.updatedAt)}</Field>
              {user.deletedAt && (
                <Field label="Excluído em">{formatTimestamp(user.deletedAt)}</Field>
              )}
            </div>
            <div className="flex justify-end border-t border-border/50 pt-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isSelf || isDeleting}
                title={isSelf ? 'Não é possível excluir a si mesmo' : undefined}
              >
                <Trash2 className="size-3.5" />
                Excluir usuário
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
