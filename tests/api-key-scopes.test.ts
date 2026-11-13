import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthError, fetchApiKeyScopes } from '../util/auth.js'

const respond = (status: number, body: unknown = {}) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }))

describe('fetchApiKeyScopes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps a read-only key to records:read', async () => {
    vi.stubGlobal('fetch', respond(200, { data: { level: 'read' } }))
    expect(await fetchApiKeyScopes('k')).toEqual(['records:read'])
  })

  it.each([401, 403])('rejects a key the backend refuses (%i)', async (status) => {
    vi.stubGlobal('fetch', respond(status))
    await expect(fetchApiKeyScopes('wrong')).rejects.toBeInstanceOf(AuthError)
  })

  it('falls back to full scopes when the endpoint is unavailable', async () => {
    vi.stubGlobal('fetch', respond(404))
    expect(await fetchApiKeyScopes('k')).toContain('records:write')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Failed to fetch') }))
    expect(await fetchApiKeyScopes('k')).toContain('records:write')
  })
})
