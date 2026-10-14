import { describe, expect, it } from 'vitest'
import RushDBImport, { CLOUD_ONLY_METHODS } from '@rushdb/javascript-sdk'

import { DIRECT_ENGINE_TOOL_NAMES, DIRECT_MODE_NOTES, TOOL_SDK_METHODS, tools } from '../tools.js'

describe('standalone direct mode', () => {
  it('maps every tool to the SDK methods it calls, and every one exists', () => {
    expect(Object.keys(TOOL_SDK_METHODS).sort()).toEqual(tools.map((tool) => tool.name).sort())
    const RushDB: any = (RushDBImport as any).default ?? RushDBImport
    const db = new RushDB('token', { direct: true, engineUrl: 'http://127.0.0.1:3000' })
    for (const methods of Object.values(TOOL_SDK_METHODS)) {
      for (const method of methods) {
        const fn = method.split('.').reduce((owner, key) => owner?.[key], db)
        expect(typeof fn, method).toBe('function')
      }
    }
  })

  it('offers exactly the tools whose SDK methods run on a standalone engine', () => {
    for (const [tool, methods] of Object.entries(TOOL_SDK_METHODS)) {
      const cloud = methods.some((method) => method in CLOUD_ONLY_METHODS)
      expect(DIRECT_ENGINE_TOOL_NAMES.has(tool as any), tool).toBe(!cloud)
    }
    for (const tool of ['textSearch', 'exportRecords', 'bulkCreateRecords', 'findRelationships', 'createTextIndex']) {
      expect(DIRECT_ENGINE_TOOL_NAMES.has(tool as any), tool).toBe(true)
    }
    for (const tool of ['smartSearch', 'listRelationshipPatterns', 'approveRelationshipPattern']) {
      expect(DIRECT_ENGINE_TOOL_NAMES.has(tool as any), tool).toBe(false)
    }
  })

  it('notes the direct-mode form of the tools that have one', () => {
    for (const tool of Object.keys(DIRECT_MODE_NOTES)) {
      expect(DIRECT_ENGINE_TOOL_NAMES.has(tool as any), tool).toBe(true)
    }
  })
})
