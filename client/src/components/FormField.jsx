import { useState } from 'react'

function FormField({ id, label, type = 'text', value, onChange, error, hint, placeholder, autoComplete }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-deep">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`h-10 w-full rounded-lg border-[1.5px] bg-mist px-3.5 text-sm text-deep placeholder:text-slate/50 transition focus:bg-white focus:outline-none focus:ring-4 ${
            isPassword ? 'pr-16' : ''
          } ${
            error
              ? 'border-rose focus:border-rose focus:ring-rose/10'
              : 'border-line focus:border-teal focus:ring-teal/10'
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-xs font-semibold text-teal hover:bg-teal/5"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-rose-dark">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField