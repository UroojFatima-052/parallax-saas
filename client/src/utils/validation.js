export function getFieldErrors(schema, values) {
  const result = schema.safeParse(values)
  if (result.success) return {}

  const errors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (!errors[field]) errors[field] = issue.message
  }
  return errors
}