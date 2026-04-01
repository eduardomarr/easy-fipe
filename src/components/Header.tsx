export function Header() {
  return (
    <header className="border-b border-red-950/30 bg-red-800 py-5">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">F</div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fipe Fácil 1.0</h1>
        </div>
        <p className="text-sm text-red-200 mt-0.5 ml-10">Consulte o valor FIPE do seu veículo</p>
      </div>
    </header>
  )
}
