import { describe, expect, it, vi } from 'vitest'

const properties = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, name: `name${i}` }))

vi.mock('../util/db.js', () => ({
  isDirectMode: () => true,
  db: { properties: { find: async () => ({ data: properties, total: properties.length }) } }
}))

describe('findProperties on a standalone engine', () => {
  it('pages the description by skip and limit', async () => {
    const { findProperties } = await import('../tools/findProperties.js')
    expect((await findProperties({ limit: 2 })).map((p: any) => p.id)).toEqual(['p0', 'p1'])
    expect((await findProperties({ skip: 3, limit: 5 })).map((p: any) => p.id)).toEqual(['p3', 'p4'])
    expect(await findProperties({})).toHaveLength(5)
  })
})
