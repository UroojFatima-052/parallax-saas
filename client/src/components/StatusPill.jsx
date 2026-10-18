const STYLES = {
  confirmed: 'bg-teal/10 text-teal',
  pending: 'bg-peach/50 text-deep',
  cancelled: 'bg-line text-slate',
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STYLES[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  )
}

export default StatusPill