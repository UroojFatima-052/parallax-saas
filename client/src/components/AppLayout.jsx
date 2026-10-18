import { NavLink, useNavigate } from 'react-router-dom'
import AjrakStrip from './AjrakStrip.jsx'
import { clearSession } from '../utils/session.js'

const NAV_ITEMS = [
  { label: 'Bookings', to: '/bookings' },
  { label: 'Customers' },
  { label: 'Team' },
  { label: 'Billing' },
  { label: 'Settings' },
]

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function OrgTile({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className="shrink-0" aria-hidden="true">
      <rect width="36" height="36" rx="8" className="fill-deep" />
      <rect x="3.5" y="3.5" width="29" height="29" rx="5.5" fill="none" strokeWidth="2" className="stroke-rose" />
      <polygon points="18,7.5 28.5,18 18,28.5 7.5,18" className="fill-rose" />
      <circle cx="18" cy="18" r="3" className="fill-paper" />
    </svg>
  )
}

function NavDiamond({ active }) {
  return (
    <span
      className={`h-2 w-2 shrink-0 rotate-45 border-[1.5px] ${active ? 'border-rose bg-rose' : 'border-current'}`}
      aria-hidden="true"
    />
  )
}

function AppLayout({ user, children }) {
  const navigate = useNavigate()

  function signOut() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="relative hidden bg-teal py-6 pr-5 pl-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <AjrakStrip direction="vertical" className="absolute inset-y-0 right-0" />

        <p className="font-display text-2xl font-semibold text-paper">Tessera</p>

        <div className="mt-7 flex items-center gap-3 rounded-xl bg-black/20 p-3">
          <OrgTile />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-paper">{user.tenant.name}</p>
            <p className="truncate text-[11px] text-paper/60">{user.tenant.slug}.tessera.app</p>
          </div>
        </div>

        <nav className="mt-7 space-y-1" aria-label="Main">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-paper/10 text-paper' : 'text-paper/70 hover:bg-paper/5 hover:text-paper'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <NavDiamond active={isActive} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-paper/45"
              >
                <NavDiamond active={false} />
                {item.label}
                <span className="ml-auto text-[10px] font-bold text-peach/80">Soon</span>
              </span>
            )
          )}
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-paper/15 pt-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose text-xs font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-paper">{user.name}</p>
            <p className="text-xs text-paper/60 capitalize">{user.role}</p>
          </div>
          <button type="button" onClick={signOut} className="text-xs font-bold text-peach hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <header className="lg:hidden">
        <div className="flex items-center justify-between bg-teal px-4 py-3">
          <div className="flex items-center gap-2.5">
            <OrgTile size={32} />
            <div>
              <p className="font-display text-lg leading-none font-semibold text-paper">Tessera</p>
              <p className="mt-1 text-[11px] text-paper/70">{user.tenant.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-paper/30 px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-paper/10"
          >
            Sign out
          </button>
        </div>
        <AjrakStrip className="block" />
      </header>

      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default AppLayout