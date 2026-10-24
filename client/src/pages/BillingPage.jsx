import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout.jsx'
import AjrakStrip from '../components/AjrakStrip.jsx'
import Modal from '../components/Modal.jsx'
import { apiRequest, newIdempotencyKey } from '../api/client.js'
import { getSession, clearSession } from '../utils/session.js'
import { useToast } from '../hooks/useToast.js'

const POLL_EVERY_MS = 1500
const MAX_POLLS = 10

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const INVOICE_STATUS = {
  paid: 'bg-teal/10 text-teal',
  open: 'bg-peach/40 text-deep',
  draft: 'bg-mist text-slate',
  void: 'bg-mist text-slate',
  uncollectible: 'bg-rose/10 text-rose-dark',
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)
}

function statusBadge(subscription) {
  if (!subscription.hasSubscription) return { label: 'Free plan', className: 'bg-mist text-slate' }
  if (subscription.status === 'past_due') return { label: 'Payment failed', className: 'bg-rose/10 text-rose-dark' }
  if (subscription.cancelAtPeriodEnd) return { label: 'Cancelling', className: 'bg-peach/40 text-deep' }
  return { label: 'Active', className: 'bg-teal/10 text-teal' }
}

function BillingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const handledCheckoutParam = useRef(false)
  const [session] = useState(getSession)
  const token = session?.token
  const canManage = Boolean(session?.user.permissions.includes('billing:manage'))

  const [data, setData] = useState({ status: 'loading', plans: [], subscription: null, invoices: [], error: null })
  const [attempt, setAttempt] = useState(0)
  const [activating, setActivating] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    Promise.all([
      apiRequest('/api/billing/plans', { token }),
      apiRequest('/api/billing/subscription', { token }),
      canManage ? apiRequest('/api/billing/invoices', { token }) : Promise.resolve({ invoices: [] }),
    ])
      .then(([plansData, subscriptionData, invoiceData]) => {
        if (cancelled) return
        setData({
          status: 'ready',
          plans: plansData.plans,
          subscription: subscriptionData.subscription,
          invoices: invoiceData.invoices,
          error: null,
        })
      })
      .catch((error) => {
        if (cancelled) return
        if (error.status === 401) {
          clearSession()
          navigate('/login', { replace: true })
          return
        }
        setData({ status: 'error', plans: [], subscription: null, invoices: [], error })
      })

    return () => {
      cancelled = true
    }
  }, [token, canManage, attempt, navigate])

  useEffect(() => {
    if (handledCheckoutParam.current) return
    if (searchParams.get('checkout') === 'success') {
      handledCheckoutParam.current = true
      setActivating(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!activating || !token) return
    let cancelled = false
    let polls = 0

    const timer = setInterval(async () => {
      polls += 1
      try {
        const result = await apiRequest('/api/billing/subscription', { token })
        if (cancelled) return
        if (result.subscription.hasSubscription) {
          clearInterval(timer)
          setActivating(false)
          setAttempt((current) => current + 1)
          toast.success('Payment received. Your new plan is active.')
          return
        }
      } catch {
        // keep polling, a later check may succeed
      }

      if (polls >= MAX_POLLS) {
        clearInterval(timer)
        setActivating(false)
        setAttempt((current) => current + 1)
        toast.info("Payment received. Your plan is still updating, refresh in a moment if it hasn't changed.")
      }
    }, POLL_EVERY_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [activating, token, toast])

  const closeConfirm = useCallback(() => setConfirmingCancel(false), [])

  if (!session) return <Navigate to="/login" replace />

  const { user } = session
  const { subscription, plans, invoices } = data
  const plan = plans.find((item) => item.id === subscription?.plan)
  const periodEnd = subscription?.currentPeriodEnd ? dateFormat.format(new Date(subscription.currentPeriodEnd)) : null

  function retryLoad() {
    setData({ status: 'loading', plans: [], subscription: null, invoices: [], error: null })
    setAttempt((current) => current + 1)
  }

  async function updateCancellation(path, message, idempotencyKey = newIdempotencyKey()) {
    setBusy(path)
    try {
      const result = await apiRequest(`/api/billing/${path}`, { method: 'POST', token, idempotencyKey })
      setData((current) => ({ ...current, subscription: result.subscription }))
      setConfirmingCancel(false)
      toast.success(message)
    } catch (error) {
      const temporary = error.status === 0 || error.status >= 500
      toast.error(
        error.message,
        temporary ? { action: { label: 'Try again', onClick: () => updateCancellation(path, message, idempotencyKey) } } : undefined
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <AppLayout user={user}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-semibold text-rose">{user.tenant.slug}.tessera.app</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-deep sm:text-4xl">Billing</h1>
        <p className="mt-2 text-sm text-slate">Your plan and payment history for {user.tenant.name}.</p>

        {activating && (
          <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-teal/20 bg-teal/5 px-5 py-4 text-sm text-deep">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" aria-hidden="true" />
            Confirming your payment with Stripe…
          </div>
        )}

        {data.status === 'loading' && (
          <div className="mt-8 animate-pulse space-y-5" aria-label="Loading billing">
            <div className="h-52 rounded-3xl bg-mist" />
            <div className="h-72 rounded-3xl bg-mist" />
          </div>
        )}

        {data.status === 'error' && (
          <div className="mt-8 rounded-2xl border border-rose/30 bg-rose/5 px-6 py-12 text-center">
            <p className="font-display text-lg text-deep">Couldn't load billing</p>
            <p className="mt-1 text-sm text-slate">{data.error.message}</p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-4 h-10 rounded-lg bg-teal px-5 text-sm font-semibold text-paper transition hover:bg-deep"
            >
              Try again
            </button>
          </div>
        )}

        {data.status === 'ready' && (
          <>
            <section className="mt-8 overflow-hidden rounded-3xl bg-teal text-paper shadow-xl shadow-teal/15">
              <AjrakStrip className="block" />
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-bold tracking-wide text-peach uppercase">Your plan</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadge(subscription).className}`}>
                      {statusBadge(subscription).label}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{plan?.name}</p>
                  <p className="mt-1 text-sm text-paper/80">
                    ${plan?.price} / month
                    {subscription.hasSubscription && periodEnd && (
                      <>
                        {' · '}
                        {subscription.cancelAtPeriodEnd ? `Ends on ${periodEnd}` : `Renews on ${periodEnd}`}
                      </>
                    )}
                  </p>
                  {subscription.status === 'past_due' && (
                    <p className="mt-3 text-sm font-semibold text-peach">
                      Your last payment didn't go through. Stripe will retry it automatically.
                    </p>
                  )}
                </div>

                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/billing/plans"
                      className="flex h-11 items-center rounded-xl bg-paper px-5 text-sm font-bold text-teal transition hover:bg-white"
                    >
                      {subscription.hasSubscription ? 'Change plan' : 'Upgrade'}
                    </Link>
                    {subscription.hasSubscription &&
                      (subscription.cancelAtPeriodEnd ? (
                        <button
                          type="button"
                          disabled={busy === 'resume'}
                          onClick={() => updateCancellation('resume', `You'll stay on ${plan?.name}`)}
                          className="h-11 rounded-xl border border-paper/40 px-5 text-sm font-bold text-paper transition hover:bg-paper/10 disabled:opacity-70"
                        >
                          {busy === 'resume' ? 'Please wait…' : 'Keep my plan'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingCancel(true)}
                          className="h-11 rounded-xl border border-paper/30 px-5 text-sm font-semibold text-paper/90 transition hover:bg-paper/10"
                        >
                          Cancel plan
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-paper/75">Only admins can change the plan.</p>
                )}
              </div>
            </section>

            {canManage && (
              <section className="mt-8">
                <h2 className="font-display text-2xl font-semibold text-deep">Billing history</h2>

                {invoices.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
                    <p className="font-display text-lg text-deep">No invoices yet</p>
                    <p className="mt-1 text-sm text-slate">Your invoices will show up here after your first payment.</p>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                    {invoices.map((invoice) => (
                      <li
                        key={invoice.id}
                        className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-deep">{invoice.reason}</p>
                          <p className="text-sm text-slate">
                            {shortDateFormat.format(new Date(invoice.createdAt))}
                            {invoice.number ? ` · ${invoice.number}` : ''}
                          </p>
                        </div>
                        <p className="font-display text-lg font-semibold text-deep">
                          {formatMoney(invoice.amount, invoice.currency)}
                        </p>
                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            INVOICE_STATUS[invoice.status] || 'bg-mist text-slate'
                          }`}
                        >
                          {invoice.status}
                        </span>
                        <div className="flex gap-3 text-sm font-semibold">
                          {invoice.hostedUrl && (
                            <a href={invoice.hostedUrl} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                              View
                            </a>
                          )}
                          {invoice.pdfUrl && (
                            <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                              PDF
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <Modal open={confirmingCancel} title="Cancel your plan" onClose={closeConfirm}>
        <p className="text-sm leading-relaxed text-deep">
          You'll keep <span className="font-semibold">{plan?.name}</span> until{' '}
          <span className="font-semibold">{periodEnd}</span>, then {user.tenant.name} moves to the Free plan. You won't be
          charged again, and you can undo this any time before then.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={closeConfirm}
            className="h-11 flex-1 rounded-xl border border-line bg-white text-sm font-semibold text-deep transition hover:bg-mist"
          >
            Keep my plan
          </button>
          <button
            type="button"
            disabled={busy === 'cancel'}
            onClick={() => updateCancellation('cancel', `Your plan will end on ${periodEnd}`)}
            className="h-11 flex-1 rounded-xl bg-rose text-sm font-semibold text-white transition hover:bg-rose-dark disabled:opacity-70"
          >
            {busy === 'cancel' ? 'Please wait…' : 'Cancel plan'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  )
}

export default BillingPage