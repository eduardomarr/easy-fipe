import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldAlert, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { UsersTable } from './components/UsersTable'
import { UserDetailDrawer } from './components/UserDetailDrawer'
import { useDeleteUser, useUser, useUsers } from './hooks/useUsers'

export function UsersView() {
  const { data: currentUser, isLoading: isLoadingMe } = useCurrentUser()
  const { data: users = [], isLoading } = useUsers()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedUser, isLoading: isLoadingDetail } = useUser(selectedId)
  const deleteMutation = useDeleteUser()

  if (isLoadingMe) {
    return (
      <div className="px-6 py-6 space-y-2">
        <Skeleton className="h-[60px] w-full rounded-xl" />
      </div>
    )
  }

  if (currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />
  }

  function handleSelect(id: string) {
    setSelectedId(id)
  }

  function handleClose() {
    setSelectedId(null)
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null)
      },
    })
  }

  function handleDeleteSelected() {
    if (selectedId) handleDelete(selectedId)
  }

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Users className="size-8 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">Nenhum usuário cadastrado</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Quando alguém criar uma conta, aparecerá aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldAlert className="size-4 text-primary" />
        <span>
          {users.length} usuário{users.length !== 1 ? 's' : ''} ativo{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <UsersTable
          users={users}
          selectedId={selectedId}
          currentUserId={currentUser?.id}
          onSelect={handleSelect}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
        {selectedId && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <UserDetailDrawer
              user={selectedUser}
              isLoading={isLoadingDetail}
              isSelf={selectedId === currentUser?.id}
              isDeleting={deleteMutation.isPending}
              onClose={handleClose}
              onDelete={handleDeleteSelected}
            />
          </div>
        )}
      </div>
    </div>
  )
}
