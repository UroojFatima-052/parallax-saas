const QUERY_OPERATIONS = [
  'find',
  'findOne',
  'countDocuments',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'findOneAndUpdate',
  'findOneAndDelete',
  'replaceOne',
]

export function tenantGuard(schema) {
  schema.pre(QUERY_OPERATIONS, function () {
    if (this.getOptions().skipTenantCheck) return

    const filter = this.getFilter()
    if (!filter.tenantId) {
      throw new Error(
        `Tenant isolation: ${this.model.modelName}.${this.op}() was called without a tenantId`
      )
    }
  })
}