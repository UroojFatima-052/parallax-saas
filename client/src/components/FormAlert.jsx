function FormAlert({ message }) {
  if (!message) return null

  return (
    <div role="alert" className="mb-4 rounded-lg border border-rose/30 bg-rose/5 px-3.5 py-2.5 text-sm font-medium text-rose-dark">
      {message}
    </div>
  )
}

export default FormAlert