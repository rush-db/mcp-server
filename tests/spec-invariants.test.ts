/**
 * Guards the MCP-owned query spec and prompt against drift and
 * against reintroducing instruction bias that causes silent LLM hallucinations
 * (invented labels/fields/relationship types return empty results, not errors).
 *
 * Cross-repository consumers pin a published version of this package. Their
 * release checks validate integration compatibility; this repository must stay
 * independently cloneable and testable.
 */
import { describe, expect, it } from 'vitest'

import { SEARCH_QUERY_SPEC } from '../searchQuerySpec.js'
import { SYSTEM_PROMPT } from '../systemPrompt.js'

const COPIES: Record<string, string> = {
  'mcp-server/searchQuerySpec.ts': SEARCH_QUERY_SPEC
}

/**
 * Query-side claims that misdescribe the engine or prime the model toward
 * guessed tokens. The traversal parser is case-agnostic and labels are
 * case-sensitive; display fields must come from discovery; traversal blocks
 * always require the related record to exist.
 */
const BANNED: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /ALL[-_]CAPS/, reason: 'traversal keys are schema-spelled, not a case convention' },
  { pattern: /label name \(UPPER_?CASE\)/i, reason: 'traversal keys are schema-spelled, not uppercase' },
  { pattern: /likely display field/i, reason: 'display fields must be resolved via schema discovery' },
  {
    pattern: /even if (the related record doesn'?t exist|no related record exists)/i,
    reason: 'traversal blocks require existence (recordN IS NOT NULL)'
  },
  {
    pattern: /\$cycle["']?\s*:\s*true/,
    reason: 'the removed $cycle block form must never be shown, even as a counter-example'
  }
]

/** Rules and features every copy must state — a missing one means copy drift. */
const REQUIRED: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /never from these examples/, reason: 'global example-names disclaimer' },
  { pattern: /__RUSHDB__RELATION__DEFAULT__/, reason: 'default-relation reality for imported data' },
  { pattern: /exactly as spelled in the schema/, reason: 'case-agnostic, schema-verbatim traversal keys' },
  { pattern: /hops/, reason: 'variable-length traversal documented' },
  { pattern: /\$cycle/, reason: 'cycle detection documented' },
  {
    pattern: /\$cycle["']?\s*:\s*\{\s*["']?(type|direction|hops)/,
    reason: 'cycle operator form documented (the value IS the traversal spec)'
  }
]

describe('SearchQuery spec invariants', () => {
  for (const [name, content] of Object.entries(COPIES)) {
    describe(name, () => {
      for (const { pattern, reason } of BANNED) {
        it(`does not contain ${pattern} (${reason})`, () => {
          expect(content).not.toMatch(pattern)
        })
      }
      for (const { pattern, reason } of REQUIRED) {
        it(`contains ${pattern} (${reason})`, () => {
          expect(content).toMatch(pattern)
        })
      }
    })
  }

  describe('mcp-server/systemPrompt.ts', () => {
    for (const { pattern, reason } of BANNED) {
      it(`does not contain ${pattern} (${reason})`, () => {
        expect(SYSTEM_PROMPT).not.toMatch(pattern)
      })
    }
  })
})
