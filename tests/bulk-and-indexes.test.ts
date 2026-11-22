import { describe, expect, it, vi } from 'vitest'

const calls: Array<[string, unknown]> = []
let failAt = -1
const state: { indexes: any } = { indexes: undefined }

const write = (method: string) => async (params: any) => {
  calls.push([method, params.data.length])
  if (calls.length - 1 === failAt) throw new Error('503 unavailable')
  const data = params.data.map((row: any, i: number) => ({ id: `${calls.length}-${i}`, data: row }))
  return { data, total: data.length }
}

vi.mock('../util/db.js', () => ({
  isDirectMode: () => false,
  db: {
    records: { createMany: write('createMany'), importJson: write('importJson') },
    get indexes() {
      return state.indexes
    }
  }
}))

const rows = (n: number, row: (i: number) => any = (i) => ({ n: i })) => Array.from({ length: n }, (_, i) => row(i))

describe('bulkCreateRecords batching', () => {
  it('sends flat rows in batches of 5,000 and nested documents in batches of 10,000', async () => {
    const { bulkCreateRecords } = await import('../tools/bulkCreateRecords.js')
    calls.length = 0
    const flat = await bulkCreateRecords({ label: 'Item', data: rows(12_001) })
    expect(calls).toEqual([
      ['createMany', 5000],
      ['createMany', 5000],
      ['createMany', 2001]
    ])
    expect(flat.ids).toHaveLength(12_001)
    expect(flat.total).toBe(12_001)
    expect(flat.message).toBe("Successfully created 12001 records with label 'Item' in 3 batches")

    calls.length = 0
    await bulkCreateRecords({ label: 'Order', data: rows(10_001, (i) => ({ n: i, line: { sku: 'a' } })) })
    expect(calls).toEqual([
      ['importJson', 10_000],
      ['importJson', 1]
    ])

    calls.length = 0
    const small = await bulkCreateRecords({ label: 'Item', data: rows(3) })
    expect(calls).toEqual([['createMany', 3]])
    expect(small.message).toBe("Successfully created 3 records with label 'Item'")
  })

  it('also splits by size', async () => {
    const { toBatches } = await import('../tools/bulkCreateRecords.js')
    const big = rows(10, () => ({ text: 'x'.repeat(1000) }))
    expect(toBatches(big, 5000, 3000).map((b) => b.length)).toEqual([2, 2, 2, 2, 2])
    expect(toBatches([], 5000)).toEqual([])
  })

  it('says what stayed written when a later batch fails outside a transaction', async () => {
    const { bulkCreateRecords } = await import('../tools/bulkCreateRecords.js')
    calls.length = 0
    failAt = 1
    const error: any = await bulkCreateRecords({ label: 'Item', data: rows(7000) }).catch((e) => e)
    failAt = -1
    expect(error.message).toBe(
      '503 unavailable (Batch 2 of 2 failed; the 5000 records of the 1 batch before it were written and stay written.)'
    )
    // The status prefix stays first, for the status mapping.
    expect(/^(\d{3})(?:\s|$)/.exec(error.message)?.[1]).toBe('503')

    calls.length = 0
    failAt = 1
    const inTx: any = await bulkCreateRecords({ label: 'Item', data: rows(7000), transactionId: 'tx' }).catch((e) => e)
    failAt = -1
    expect(inTx.message).toBe('503 unavailable')
  })
})

describe('property index tools', () => {
  it('explain a missing db.indexes', async () => {
    const { listIndexes } = await import('../tools/listIndexes.js')
    state.indexes = undefined
    await expect(listIndexes()).rejects.toThrow(/RushDB SDK has no db.indexes/)
  })

  it('call db.indexes and report unique from kind when the SDK leaves it out', async () => {
    const { listIndexes } = await import('../tools/listIndexes.js')
    const { createIndex } = await import('../tools/createIndex.js')
    const { deleteIndex } = await import('../tools/deleteIndex.js')
    const seen: unknown[] = []
    state.indexes = {
      find: async () => ({
        success: true,
        data: [{ name: 'User.email.unique', label: 'User', property: 'email', kind: 'unique', status: 'ready' }]
      }),
      create: async (params: any) => (
        seen.push(params),
        { success: true, data: { name: 'n', ...params, unique: Boolean(params.unique), status: 'building' } }
      ),
      delete: async (name: string) => (seen.push(name), { success: true, data: { deleted: false } })
    }
    expect((await listIndexes())[0]).toMatchObject({ unique: true, kind: 'unique' })
    expect(await createIndex({ label: 'User', property: 'email', unique: true })).toMatchObject({ unique: true, status: 'building' })
    await createIndex({ label: 'Item', property: 'price', name: 'item_price' })
    expect(await deleteIndex({ name: 'gone' })).toEqual({ deleted: false })
    expect(seen).toEqual([
      { label: 'User', property: 'email', unique: true },
      { label: 'Item', property: 'price', name: 'item_price' },
      'gone'
    ])
  })

  it('are annotated like the text index tools', async () => {
    const { tools, DIRECT_ENGINE_TOOL_NAMES } = await import('../tools.js')
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    expect(byName.listIndexes.annotations).toEqual(byName.listTextIndexes.annotations)
    expect(byName.createIndex.annotations).toEqual(byName.createTextIndex.annotations)
    expect(byName.deleteIndex.annotations).toEqual(byName.deleteTextIndex.annotations)
    for (const name of ['listIndexes', 'createIndex', 'deleteIndex'] as const) {
      expect(DIRECT_ENGINE_TOOL_NAMES.has(name), name).toBe(true)
    }
  })
})
