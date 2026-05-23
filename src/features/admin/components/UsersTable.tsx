import { Eye, Trash2 } from 'lucide-react'
import type { AdminUser } from '@/api/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface Props {
  users: AdminUser[]
  selectedId: string | null
  currentUserId: string | undefined
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function UsersTable({
  users,
  selectedId,
  currentUserId,
  onSelect,
  onDelete,
  isDeleting,
}: Props) {
  return (
    <div className="space-y-2">
      {users.map((user) => {
        const initial = user.email.charAt(0).toUpperCase()
        const isSelf = user.id === currentUserId
        const isSelected = user.id === selectedId
        function handleSelect() {
          onSelect(user.id)
        }
        function handleDelete() {
          onDelete(user.id)
        }
        return (
          <Card
            key={user.id}
            className={isSelected ? 'border-primary/50' : 'border-border/50'}
          >
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-bold text-primary">{initial}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{user.email}</p>
                  {user.role === 'admin' && (
                    <Badge variant="secondary" className="text-[10px]">
                      admin
                    </Badge>
                  )}
                  {isSelf && (
                    <Badge variant="outline" className="text-[10px]">
                      você
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user.fullName ?? 'Sem nome'} · entrou em {formatDate(user.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleSelect}
                aria-label="Ver detalhes"
              >
                <Eye className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                onClick={handleDelete}
                aria-label="Excluir usuário"
                disabled={isSelf || isDeleting}
                title={isSelf ? 'Não é possível excluir a si mesmo' : 'Excluir usuário'}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
