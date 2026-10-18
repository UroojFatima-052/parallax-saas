function AppHeader({ user, onSignOut }) {
  return (
    <header className="border-b-[3px] border-rose bg-teal">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-display text-xl font-semibold text-paper">Tessera</span>
          <span className="hidden h-5 w-px bg-paper/30 sm:block" aria-hidden="true" />
          <span className="hidden truncate text-sm text-paper/80 sm:block">{user.tenant.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-paper/80 md:inline">
            {user.name} · <span className="capitalize">{user.role}</span>
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg border border-paper/30 px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-paper/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default AppHeader