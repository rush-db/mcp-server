import { describe, expect, it } from 'vitest'
import { tools } from '../tools.js'

// Tools that overwrite or remove existing data, including update and upsert.
const DESTRUCTIVE = new Set([
  'updateRecord',
  'setRecord',
  'updateRelation',
  'upsertEmbeddingVectors',
  'syncConnection',
  'deleteRecord',
  'deleteRecordById',
  'bulkDeleteRecords',
  'detachRelation',
  'deleteRelationshipPattern',
  'deleteProperty',
  'deleteEmbeddingIndex',
  'deleteTextIndex',
  'deleteIndex'
])

describe('tool annotations', () => {
  it.each(tools.map((tool) => [tool.name, tool] as const))('%s has a title and every hint', (_, tool) => {
    expect(tool.title.trim()).not.toBe('')
    const { readOnlyHint, destructiveHint, openWorldHint, idempotentHint } = tool.annotations
    expect(typeof readOnlyHint).toBe('boolean')
    expect(typeof destructiveHint).toBe('boolean')
    expect(typeof openWorldHint).toBe('boolean')
    expect(['boolean', 'undefined']).toContain(typeof idempotentHint)
  })

  it('marks every tool that overwrites or deletes data as destructive', () => {
    const destructive = tools.filter((tool) => tool.annotations.destructiveHint).map((tool) => tool.name)
    expect(new Set(destructive)).toEqual(DESTRUCTIVE)
  })

  it('marks only syncConnection as open-world', () => {
    expect(tools.filter((tool) => tool.annotations.openWorldHint).map((tool) => tool.name)).toEqual([
      'syncConnection'
    ])
  })

  it('keeps the create tools non-destructive and documents their upsert behavior', () => {
    for (const name of ['createRecord', 'bulkCreateRecords']) {
      const tool = tools.find((tool) => tool.name === name)!
      expect(tool.annotations.destructiveHint, name).toBe(false)
      expect(tool.description, name).toMatch(/changed in place/)
    }
  })

  it('keeps read-only tools non-destructive and idempotent', () => {
    for (const tool of tools.filter((tool) => tool.annotations.readOnlyHint)) {
      expect(tool.annotations.destructiveHint, tool.name).toBe(false)
      expect(tool.annotations.idempotentHint, tool.name).toBe(true)
    }
  })

  it('gives every tool a unique title', () => {
    expect(new Set(tools.map((tool) => tool.title)).size).toBe(tools.length)
  })
})
