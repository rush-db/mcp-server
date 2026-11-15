import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { OPENAI_APPS_CHALLENGE_PATH, registerWellKnownRoutes } from '../util/wellKnown.js'

const appWith = (token: string | undefined) => {
  const proxy = vi.fn((c) => c.json({ proxied: c.req.path }))
  const app = new Hono()
  registerWellKnownRoutes(app, proxy, token)
  return { app, proxy }
}

describe('registerWellKnownRoutes', () => {
  it('serves the OpenAI challenge token as plain text before the proxy', async () => {
    const { app, proxy } = appWith('challenge-token')
    const res = await app.request(OPENAI_APPS_CHALLENGE_PATH)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^text\/plain/)
    expect(await res.text()).toBe('challenge-token')
    expect(proxy).not.toHaveBeenCalled()
  })

  it.each([undefined, '', '  '])('returns 404 when the token is unset (%j)', async (token) => {
    const { app, proxy } = appWith(token)
    const res = await app.request(OPENAI_APPS_CHALLENGE_PATH)
    expect(res.status).toBe(404)
    expect(proxy).not.toHaveBeenCalled()
  })

  it('still proxies the other /.well-known paths', async () => {
    const { app, proxy } = appWith('challenge-token')
    const res = await app.request('/.well-known/jwks.json')
    expect(await res.json()).toEqual({ proxied: '/.well-known/jwks.json' })
    expect(proxy).toHaveBeenCalledOnce()
  })
})
