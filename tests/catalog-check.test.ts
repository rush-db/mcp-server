import { describe, expect, it, vi } from 'vitest'

import {
  describeKnownError,
  formatCatalogWarning,
  formatCatalogWarnings,
  readCatalogWarnings,
  type CatalogWarning
} from '../util/catalog.js'

// The warning the engine manual shows for `{ city: "berlin" }` on Person.
const berlin: CatalogWarning = {
  kind: 'unknownValue',
  labels: ['Person'],
  property: 'city',
  value: 'berlin',
  suggestions: [
    { value: 'Berlin', reason: 'spelling' },
    { label: 'Venue', property: 'town', value: 'berlin', reason: 'storedIn' }
  ]
}

const calls: Array<[string, unknown]> = []
let findResult: any = { data: [], total: 0 }
let valuesResult: any = { data: { values: [] } }

vi.mock('../util/db.js', () => ({
  isDirectMode: () => false,
  db: {
    records: {
      find: async (query: unknown) => (calls.push(['records.find', query]), findResult),
      delete: async (query: unknown) => (calls.push(['records.delete', query]), { data: { message: 'ok' } })
    },
    properties: { values: async () => valuesResult }
  }
}))

describe('catalog warnings', () => {
  it('reads catalogWarnings, else warning objects on the wire field, never assumption strings', () => {
    expect(readCatalogWarnings({ catalogWarnings: [berlin] })).toEqual([berlin])
    expect(readCatalogWarnings({ warnings: [berlin] })).toEqual([berlin])
    expect(readCatalogWarnings({ warnings: ['Assumed "completed" is the status value.'] })).toEqual([])
    expect(readCatalogWarnings({ data: [] })).toEqual([])
    expect(readCatalogWarnings(undefined)).toEqual([])
  })

  it('names what is missing and the stored spelling', () => {
    expect(formatCatalogWarning(berlin)).toBe(
      'No Person record stores "berlin" in "city". Did you mean: stored spelling "Berlin"; stored in Venue.town as "berlin"?'
    )
    expect(formatCatalogWarning({ kind: 'unknownLabel', label: 'Persn', suggestions: [{ label: 'Person', reason: 'spelling' }] })).toBe(
      'No record has the label "Persn". Did you mean: spelled alike: Person?'
    )
    // suggestions is omitted when the server has none
    expect(formatCatalogWarning({ kind: 'unknownProperty', labels: ['Person'], property: 'emial' })).toBe(
      'No Person record has the property "emial".'
    )
    expect(formatCatalogWarnings([])).toBe('')
    expect(formatCatalogWarnings([berlin])).toMatch(/^CATALOG WARNINGS: .*\n- No Person record stores "berlin"/)
  })

  it('findRecords returns warnings and sends context.check only when asked', async () => {
    const { findRecords } = await import('../tools/findRecords.js')
    findResult = { data: [], total: 0, catalogWarnings: [berlin] }
    expect(await findRecords({ labels: ['Person'], where: { city: 'berlin' } })).toEqual({
      data: [],
      total: 0,
      warnings: [berlin]
    })
    findResult = { data: [{ data: { city: 'Berlin' } }], total: 1 }
    expect(await findRecords({ labels: ['Person'], where: { city: 'Berlin' }, check: 'strict' })).toEqual({
      data: [{ city: 'Berlin' }],
      total: 1
    })
    expect(calls.splice(0)).toEqual([
      ['records.find', { labels: ['Person'], where: { city: 'berlin' } }],
      ['records.find', { labels: ['Person'], where: { city: 'Berlin' }, context: { check: 'strict' } }]
    ])
  })

  it('bulkDeleteRecords passes check through', async () => {
    const { bulkDeleteRecords } = await import('../tools/bulkDeleteRecords.js')
    await bulkDeleteRecords({ labels: ['Task'], where: { status: { $ne: 'done' } }, check: 'strict' })
    await bulkDeleteRecords({ where: { status: 'done' } })
    expect(calls.splice(0)).toEqual([
      ['records.delete', { where: { status: { $ne: 'done' } }, labels: ['Task'], context: { check: 'strict' } }],
      ['records.delete', { where: { status: 'done' } }]
    ])
  })

  it('propertyValues returns warnings from the result or its data', async () => {
    const { propertyValues } = await import('../tools/propertyValues.js')
    valuesResult = { data: { values: [] }, catalogWarnings: [berlin] }
    expect(await propertyValues({ propertyId: 'p1', query: 'berlin' })).toEqual({ data: { values: [] }, warnings: [berlin] })
    valuesResult = { data: { values: [], catalogWarnings: [berlin] } }
    expect((await propertyValues({ propertyId: 'p1', query: 'berlin' })).warnings).toEqual([berlin])
    valuesResult = { data: { values: ['Berlin'] } }
    expect((await propertyValues({ propertyId: 'p1' })).warnings).toEqual([])
  })
})

describe('server errors with details', () => {
  // SDK 3.4.1 errors: "<status> <message>" with status, code and the parsed body.
  const sdkError = (status: number, body: any) =>
    Object.assign(new Error(`${status} ${body?.error?.message ?? ''}`.trim()), {
      status,
      code: body?.error?.code,
      body
    })

  it('explains a unique index conflict without the value', () => {
    const error = sdkError(409, {
      protocolVersion: 1,
      error: {
        code: 'conflict',
        retryable: false,
        message: 'unique constraint conflict on `User`.`email`: record 0192f0c4 holds the value',
        details: { label: 'User', property: 'email', recordId: '0192f0c4' }
      }
    })
    const text = describeKnownError(error)
    expect(text).toMatch(/^Unique index conflict \(409\): another User record \(0192f0c4\) already holds this value of "email"/)
    expect(text).toMatch(/Nothing was written/)
  })

  it('reads the typed SDK error fields too', () => {
    const error = Object.assign(new Error('409 conflict'), { status: 409, label: 'User', property: 'email', recordId: 'r1' })
    expect(describeKnownError(error)).toMatch(/another User record \(r1\)/)
  })

  it('shows the warnings of a strict catalog check refusal', () => {
    const error = sdkError(400, {
      error: { code: 'invalid_request', message: 'catalog check', details: { warnings: [berlin] } }
    })
    const text = describeKnownError(error)
    expect(text).toMatch(/^Refused by the strict catalog check/)
    expect(text).toMatch(/stored spelling "Berlin"/)
    expect(describeKnownError(Object.assign(new Error('catalog'), { code: 'invalid_request', warnings: [berlin] }))).toMatch(
      /strict catalog check/
    )
  })

  it('leaves other errors to the status mapping', () => {
    expect(describeKnownError(sdkError(409, { error: { code: 'write_conflict', message: 'retry' } }))).toBeUndefined()
    expect(describeKnownError(sdkError(400, { message: 'bad' }))).toBeUndefined()
    expect(describeKnownError(new Error('boom'))).toBeUndefined()
  })
})
