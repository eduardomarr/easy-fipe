export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="size-20 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Pronto para consultar</p>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione marca, modelo e ano para ver o valor FIPE
        </p>
      </div>
    </div>
  )
}
