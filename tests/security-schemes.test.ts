import { describe, expect, it } from 'vitest'
import { impliedScopes, isToolAllowedForScopes, tools } from '../tools.js'

describe('tool security schemes', () => {
  it('match the tools/list snapshot', () => {
    expect(
      tools.map(({ name, securitySchemes, _meta }) => ({ name, securitySchemes, _meta }))
    ).toMatchSnapshot()
  })

  it('never advertise noauth and mirror securitySchemes in _meta', () => {
    for (const tool of tools) {
      expect(tool.securitySchemes?.length, tool.name).toBeGreaterThan(0)
      expect(tool.securitySchemes?.some((s) => s.type === 'noauth'), tool.name).toBe(false)
      expect(tool._meta?.securitySchemes, tool.name).toEqual(tool.securitySchemes)
    }
  })

  it('hide every tool from a session without records scopes', () => {
    expect(tools.filter((tool) => isToolAllowedForScopes(tool, []))).toEqual([])
    expect(tools.filter((tool) => isToolAllowedForScopes(tool, ['records:read'])).length).toBeGreaterThan(0)
  })

  it('allow only the read tools for records:read', () => {
    const allowed = tools.filter((tool) => isToolAllowedForScopes(tool, ['records:read']))
    expect(allowed).toHaveLength(32)
    for (const tool of allowed) {
      expect(tool.securitySchemes, tool.name).toEqual([{ type: 'oauth2', scopes: ['records:read'] }])
    }
  })

  it('allow every tool for records:write, as for both scopes', () => {
    expect(tools).toHaveLength(53)
    expect(tools.filter((tool) => isToolAllowedForScopes(tool, ['records:write']))).toEqual(tools)
    expect(tools.filter((tool) => isToolAllowedForScopes(tool, ['records:read', 'records:write']))).toEqual(tools)
  })
})

describe('impliedScopes', () => {
  it('adds records:read to records:write', () => {
    expect(impliedScopes(['records:write'])).toEqual(['records:write', 'records:read'])
  })

  it('is idempotent and adds no duplicates', () => {
    const once = impliedScopes(['records:write'])
    expect(impliedScopes(once)).toEqual(once)
    expect(impliedScopes(['records:read', 'records:write'])).toEqual(['records:read', 'records:write'])
  })

  it('leaves other grants alone', () => {
    expect(impliedScopes(['records:read'])).toEqual(['records:read'])
    expect(impliedScopes([])).toEqual([])
  })
})
