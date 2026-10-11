import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import FormAlert from '../components/FormAlert.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { getFieldErrors } from '../utils/validation.js'
import { slugify } from '../utils/slugify.js'
import { apiRequest } from '../api/client.js'
import { saveSession } from '../utils/session.js'

const YOUR_TILE = 27

const onboardSchema = z.object({
  orgName: z.string().trim().min(2, 'Enter your business name'),
  slug: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters')
    .max(40, 'Use 40 characters or fewer')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes only'),
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

function OnboardPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ orgName: '', slug: '', name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'orgName') {
      setValues((current) => ({
        ...current,
        orgName: value,
        slug: slugEdited ? current.slug : slugify(value),
      }))
    } else if (name === 'slug') {
      setSlugEdited(true)
      setValues((current) => ({ ...current, slug: value.toLowerCase() }))
    } else {
      setValues((current) => ({ ...current, [name]: value }))
    }

    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const fieldErrors = getFieldErrors(onboardSchema, values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      const data = await apiRequest('/api/auth/onboard', { method: 'POST', body: values })
      saveSession(data)
      navigate('/dashboard')
    } catch (error) {
      if (error.status === 409) {
        setErrors({ slug: 'This URL is taken. Try another one.' })
      } else if (Object.keys(error.fieldErrors || {}).length) {
        setErrors(error.fieldErrors)
      } else {
        setFormError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const businessName = values.orgName.trim()

  return (
    <AuthLayout
      caption={businessName ? `A tile for ${businessName}.` : 'Every business deserves its own space.'}
      subcaption={businessName ? 'Its bookings will live only here.' : 'Yours is one step away.'}
      highlight={YOUR_TILE}
    >
      <h1 className="font-display text-3xl font-semibold text-deep">Create your organisation</h1>
      <p className="mt-1.5 mb-7 text-sm text-slate">Set up a space for your business. You'll be its admin.</p>

      <form onSubmit={handleSubmit} noValidate>
        <FormAlert message={formError} />

        <FormField
          id="orgName"
          label="Business name"
          value={values.orgName}
          onChange={handleChange}
          error={errors.orgName}
          placeholder="Smile Dental"
          autoComplete="organization"
        />
        <FormField
          id="slug"
          label="Organisation URL"
          value={values.slug}
          onChange={handleChange}
          error={errors.slug}
          placeholder="smile-dental"
          hint={`${values.slug || 'your-business'}.tessera.app`}
          autoComplete="off"
        />
        <FormField
          id="name"
          label="Your name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Urooj Fatima"
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

        <SubmitButton loading={loading}>Create organisation</SubmitButton>
      </form>

      <p className="mt-7 text-center text-sm text-slate">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default OnboardPage