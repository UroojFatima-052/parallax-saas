import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout.jsx'
import AjrakStrip from '../components/AjrakStrip.jsx'
import Modal from '../components/Modal.jsx'
import { apiRequest, newIdempotencyKey } from '../api/client.js'
import { getSession, clearSession } from '../utils/session.js'
import { useToast } from '../hooks/useToast.js'

const PLAN_RANK = { free: 0, pro: 1, team: 2 }
const FEATURED_PLAN = 'pro'
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function PlansPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const handledCheckoutParam = useRef(false)
  const [session] = useState(getSession)
  const token = session?.token

  const [data, setData] = useState({ status: 'loading', plans: [], subscription: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const [busyPlan, setBusyPlan] = useState(null)
  const [confirmingFree, setConfirmingFree] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    Promise.all([apiRequest('/api/billing/plans', { token }), apiRequest('/api/billing/subscription', { token })])
      .then(([plansData, subscriptionData]) => {
        if (cancelled) return
        setData({ status: 'ready', plans: plansData.plans, subscription: subscriptionData.subscription, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        if (error.status === 401) {
          clearSession()
          navigate('/login', { replace: true })
          return
        }
        setData({ status: 'error', plans: [], subscription: null, error })
      })

    return () => {
      cancelled = true
    }
  }, [token, attempt, navigate])

  useEffect(() => {
    if (handledCheckoutParam.current) return
    if (searchParams.get('checkout') === 'cancelled') {
      handledCheckoutParam.current = true
      toast.info("Checkout cancelled. You haven't been charged.")
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, toast])

  const closeConfirm = useCallback(() => setConfirmingFree(false), [])

  if (!session) return <Navigate to="/login" replace />

  const { user } = session
  const canManage = user.permissions.includes('billing:manage')
  const subscription = data.subscription
  const currentPlan = data.plans.find((plan) => plan.id === subscription?.plan)
  const periodEnd = subscription?.currentPeriodEnd ? dateFormat.format(new Date(subscription.currentPeriodEnd)) : null

  function showError(error, retry) {
    const temporary = error.status === 0 || error.status >= 500
    toast.error(error.message, temporary ? { action: { label: 'Try again', onClick: retry } } : undefined)
  }

  function retryLoad() {
    setData({ status: 'loading', plans: [], subscription: null, error: null })
    setAttempt((current) => current + 1)
  }

  async function startCheckout(plan, idempotencyKey = newIdempotencyKey()) {
    setBusyPlan(plan.id)
    try {
      const result = await apiRequest('/api/billing/checkout', {
        method: 'POST',
        body: { plan: plan.id },
        token,
        idempotencyKey,
      })
      window.location.assign(result.url)
    } catch (error) {
      setBusyPlan(null)
      showError(error, () => startCheckout(plan, idempotencyKey))
    }
  }

  async function switchPlan(plan, idempotencyKey = newIdempotencyKey()) {
    setBusyPlan(plan.id)
    try {
      const result = await apiRequest('/api/billing/change-plan', {
        method: 'POST',
        body: { plan: plan.id },
        token,
        idempotencyKey,
      })
      setData((current) => ({ ...current, subscription: result.subscription }))
      toast.success(`You're now on ${plan.name}`)
      navigate('/billing')
    } catch (error) {
      showError(error, () => switchPlan(plan, idempotencyKey))
    } finally {
      setBusyPlan(null)
    }
  }

  async function updateCancellation(path, message, idempotencyKey = newIdempotencyKey()) {
    setBusyPlan(path)
    try {
      const result = await apiRequest(`/api/billing/${path}`, { method: 'POST', token, idempotencyKey })
      setData((current) => ({ ...current, subscription: result.subscription }))
      setConfirmingFree(false)
      toast.success(message)
    } catch (error) {
      showError(error, () => updateCancellation(path, message, idempotencyKey))
    } finally {
      setBusyPlan(null)
    }
  }

  function actionFor(plan) {
    const isCurrent = subscription.plan === plan.id
    const cancelling = subscription.cancelAtPeriodEnd

    if (isCurrent && !(plan.id !== 'free' && cancelling)) return { label: 'Current plan', disabled: true }
    if (!canManage) return { label: 'Ask your admin', disabled: true }

    if (isCurrent && cancelling) {
      return {
        label: 'Keep this plan',
        busy: busyPlan === 'resume',
        onClick: () => updateCancellation('resume', `You'll stay on ${plan.name}`),
      }
    }

    if (plan.id === 'free') {
      if (cancelling) return { label: `Switching on ${periodEnd}`, disabled: true }
      return { label: 'Downgrade to Free', quiet: true, onClick: () => setConfirmingFree(true) }
    }

    if (!subscription.hasSubscription) {
      return { label: `Upgrade to ${plan.name}`, busy: busyPlan === plan.id, onClick: () => startCheckout(plan) }
    }

    const isUpgrade = PLAN_RANK[plan.id] > PLAN_RANK[subscription.plan]
    return {
      label: `${isUpgrade ? 'Upgrade' : 'Switch'} to ${plan.name}`,
      busy: busyPlan === plan.id,
      onClick: () => switchPlan(plan),
    }
  }

  return (
    <AppLayout user={user}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <Link to="/billing" className="text-sm font-semibold text-teal hover:underline">
          ‹ Back to billing
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-deep sm:text-4xl">Choose a plan</h1>
        <p className="mt-2 max-w-xl text-sm text-slate">
          Every plan gives {user.tenant.name} its own private space. Change or cancel any time.
        </p>

        {subscription?.cancelAtPeriodEnd && currentPlan && (
          <div className="mt-6 rounded-2xl border border-peach bg-peach/25 px-5 py-4 text-sm text-deep">
            Your {currentPlan.name} plan ends on <span className="font-semibold">{periodEnd}</span>. After that you'll
            move to Free.
          </div>
        )}

        {subscription?.status === 'past_due' && (
          <div role="alert" className="mt-6 rounded-2xl border border-rose/30 bg-rose/5 px-5 py-4 text-sm text-rose-dark">
            Your last payment didn't go through. Update your card in the billing page to keep your plan.
          </div>
        )}

        {data.status === 'loading' && (
          <div className="mt-8 grid animate-pulse gap-5 md:grid-cols-3" aria-label="Loading plans">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-[420px] rounded-3xl bg-mist" />
            ))}
          </div>
        )}

        {data.status === 'error' && (
          <div className="mt-8 rounded-2xl border border-rose/30 bg-rose/5 px-6 py-12 text-center">
            <p className="font-display text-lg text-deep">Couldn't load plans</p>
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
          <div className="mt-8 grid items-stretch gap-5 md:grid-cols-3">
            {data.plans.map((plan) => {
              const featured = plan.id === FEATURED_PLAN
              const isCurrent = subscription.plan === plan.id
              const action = actionFor(plan)

              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-3xl border transition ${
                    featured
                      ? 'border-teal bg-teal text-paper shadow-xl shadow-teal/20'
                      : 'border-line bg-white text-deep'
                  } ${isCurrent ? 'ring-2 ring-rose ring-offset-2' : ''}`}
                >
                  {featured && <AjrakStrip className="block" />}

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
                      {isCurrent ? (
                        <span className="rounded-full bg-rose px-2.5 py-1 text-[11px] font-bold text-white">Your plan</span>
                      ) : (
                        featured && (
                          <span className="rounded-full bg-peach px-2.5 py-1 text-[11px] font-bold text-deep">
                            Most popular
                          </span>
                        )
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${featured ? 'text-paper/75' : 'text-slate'}`}>{plan.description}</p>

                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="font-display text-5xl font-semibold">${plan.price}</span>
                      <span className={`text-sm ${featured ? 'text-paper/70' : 'text-slate'}`}>/ month</span>
                    </p>

                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rotate-45 ${featured ? 'bg-peach' : 'bg-rose'}`}
                            aria-hidden="true"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={action.onClick}
                      disabled={action.disabled || action.busy}
                      className={`mt-8 h-12 w-full rounded-xl text-sm font-bold transition disabled:cursor-default ${
                        action.disabled
                          ? featured
                            ? 'bg-paper/15 text-paper/70'
                            : 'bg-mist text-slate'
                          : action.quiet
                            ? 'border border-line bg-white text-deep hover:bg-mist'
                            : featured
                              ? 'bg-paper text-teal hover:bg-white'
                              : 'bg-teal text-paper hover:bg-deep'
                      } ${action.busy ? 'cursor-wait opacity-70' : ''}`}
                    >
                      {action.busy ? 'Please wait…' : action.label}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate">
          Payments are handled by Stripe. This is test mode: use card 4242 4242 4242 4242, any future date and any CVC.
        </p>
      </main>

      <Modal open={confirmingFree} title="Downgrade to Free" onClose={closeConfirm}>
        <p className="text-sm leading-relaxed text-deep">
          You'll keep <span className="font-semibold">{currentPlan?.name}</span> until{' '}
          <span className="font-semibold">{periodEnd}</span>. After that, {user.tenant.name} moves to the Free plan. You
          can change your mind any time before then.
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
            disabled={busyPlan === 'cancel'}
            onClick={() =>
              updateCancellation('cancel', `Your plan will switch to Free on ${periodEnd}`)
            }
            className="h-11 flex-1 rounded-xl bg-rose text-sm font-semibold text-white transition hover:bg-rose-dark disabled:opacity-70"
          >
            {busyPlan === 'cancel' ? 'Please wait…' : 'Downgrade'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  )
}

export default PlansPage