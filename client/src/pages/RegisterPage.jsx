import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import FormAlert from '../components/FormAlert.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { getFieldErrors } from '../utils/validation.js'
import { apiRequest } from '../api/client.js'
import { saveSession } from '../utils/session.js'

const registerSchema = z.object({
  orgSlug: z.string().trim().min(1, 'Enter your organisation URL'),
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

function RegisterPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ orgSlug: '', name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const fieldErrors = getFieldErrors(registerSchema, values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      const data = await apiRequest('/api/auth/register', { method: 'POST', body: values })
      saveSession(data)
      navigate('/dashboard')
    } catch (error) {
      if (error.status === 404) {
        setErrors({ orgSlug: "We couldn't find that organisation. Check the URL with your admin." })
      } else if (error.status === 409) {
        setErrors({ email: 'This email already has an account here. Try signing in.' })
      } else if (Object.keys(error.fieldErrors || {}).length) {
        setErrors(error.fieldErrors)
      } else {
        setFormError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout caption="Your team is waiting for you." subcaption="Join them and get to work.">
      <h1 className="font-display text-3xl font-semibold text-deep">Join your team</h1>
      <p className="mt-1.5 mb-7 text-sm text-slate">Ask your admin for your organisation URL</p>

      <form onSubmit={handleSubmit} noValidate>
        <FormAlert message={formError} />

        <FormField
          id="orgSlug"
          label="Organisation URL"
          value={values.orgSlug}
          onChange={handleChange}
          error={errors.orgSlug}
          placeholder="city-clinic"
          autoComplete="organization"
        />
        <FormField
          id="name"
          label="Your name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Ali Hassan"
          autoComplete="name"
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@business.com"
          autoComplete="email"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          hint="At least 8 characters"
          autoComplete="new-password"
        />

        <SubmitButton loading={loading}>Join organisation</SubmitButton>
      </form>

      <div className="mt-7 space-y-1.5 text-center text-sm text-slate">
        <p>
          Setting up a new business?{' '}
          <Link to="/onboard" className="font-semibold text-teal hover:underline">
            Create an organisation
          </Link>
        </p>
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-teal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage