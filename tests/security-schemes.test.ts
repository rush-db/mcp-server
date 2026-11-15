import { describe, expect, it } from 'vitest'
import { isToolAllowedForScopes, tools } from '../tools.js'

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
})
