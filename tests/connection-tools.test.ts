import { describe, expect, it, vi } from 'vitest'

const calls: Array<[string, ...unknown[]]> = []
const run = { id: 'run-1', kind: 'sync', status: 'queued' }

vi.mock('../util/db.js', () => ({
  isDirectMode: () => false,
  db: {
    connections: {
      list: async () => (calls.push(['connections.list']), { data: [{ id: 'conn-1' }] }),
      get: async (id: string) => (calls.push(['connections.get', id]), { data: { id } }),
      sync: async (id: string, params: unknown) => (calls.push(['connections.sync', id, params]), { data: run })
    },
    imports: {
      list: async (params: unknown) => (calls.push(['imports.list', params]), { data: [run], total: 7 }),
      get: async (id: string) => (calls.push(['imports.get', id]), { data: { ...run, id } })
    }
  }
}))

describe('connection and import tools', () => {
  it('call the SDK methods they declare', async () => {
    const { listConnections } = await import('../tools/listConnections.js')
    const { getConnection } = await import('../tools/getConnection.js')
    const { syncConnection } = await import('../tools/syncConnection.js')
    const { listImports } = await import('../tools/listImports.js')
    const { getImport } = await import('../tools/getImport.js')

    expect(await listConnections()).toEqual([{ id: 'conn-1' }])
    expect(await getConnection({ id: 'conn-1' })).toEqual({ id: 'conn-1' })
    expect(await syncConnection({ id: 'conn-1' })).toEqual(run)
    await syncConnection({ id: 'conn-1', streams: ['contacts'], full: true })
    expect(await listImports({ kind: 'sync', connectionId: 'conn-1' })).toEqual({ imports: [run], total: 7 })
    expect(await getImport({ id: 'run-2' })).toEqual({ ...run, id: 'run-2' })

    expect(calls).toEqual([
      ['connections.list'],
      ['connections.get', 'conn-1'],
      ['connections.sync', 'conn-1', {}],
      ['connections.sync', 'conn-1', { streams: ['contacts'], full: true }],
      ['imports.list', { kind: 'sync', connectionId: 'conn-1' }],
      ['imports.get', 'run-2']
    ])
  })

  it('are annotated and gated like other reads and writes', async () => {
    const { tools, DIRECT_ENGINE_TOOL_NAMES } = await import('../tools.js')
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    for (const name of ['listConnections', 'getConnection', 'listImports', 'getImport'] as const) {
      expect(byName[name].annotations, name).toMatchObject({ readOnlyHint: true, destructiveHint: false })
      expect(DIRECT_ENGINE_TOOL_NAMES.has(name), name).toBe(false)
    }
    expect(byName.syncConnection.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false })
    expect(byName.syncConnection.securitySchemes).toEqual([{ type: 'oauth2', scopes: ['records:write'] }])
    expect(DIRECT_ENGINE_TOOL_NAMES.has('syncConnection')).toBe(false)
  })
})
