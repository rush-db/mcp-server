// Copyright Collect Software, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Catalog check (RushDB 3.0.14+): a records or property-values query that names a
// label, property or text no record holds comes back with `warnings`, each with what
// the query most likely meant. Servers before 3.0.14 send none, and a query without
// misses has no warnings field, so everything here treats them as optional.

export type CatalogCheckMode = 'warn' | 'strict' | 'off'

export const CATALOG_CHECK_MODES: CatalogCheckMode[] = ['warn', 'strict', 'off']

export type CatalogSuggestion = {
  label?: string
  property?: string
  value?: unknown
  /** spelling | storedIn | contains (more may come) */
  reason?: string
  [key: string]: unknown
}

export type CatalogWarning = {
  /** unknownLabel | unknownProperty | unknownValue (more may come) */
  kind: string
  label?: string
  labels?: string[]
  property?: string
  value?: unknown
  /** Omitted when the server has nothing to suggest. */
  suggestions?: CatalogSuggestion[]
  [key: string]: unknown
}

const isWarning = (w: unknown): w is CatalogWarning =>
  Boolean(w) && typeof w === 'object' && !Array.isArray(w) && typeof (w as any).kind === 'string'

const asWarnings = (value: unknown): CatalogWarning[] =>
  Array.isArray(value) ? value.filter(isWarning) : []

/**
 * Catalog warnings of an SDK result: `catalogWarnings` (SDK with catalog check
 * support), else the wire field `warnings` when it holds warning objects (the
 * SDK's own `warnings` are smart-search assumption strings and are skipped).
 */
export function readCatalogWarnings(result: unknown): CatalogWarning[] {
  if (!result || typeof result !== 'object') return []
  const r = result as Record<string, unknown>
  const typed = asWarnings(r.catalogWarnings)
  return typed.length ? typed : asWarnings(r.warnings)
}

const quote = (v: unknown) => (typeof v === 'string' ? `"${v}"` : JSON.stringify(v))

const where = (w: CatalogWarning) => {
  const labels = w.labels?.length ? w.labels : w.label ? [w.label] : []
  return labels.length ? labels.join('/') : 'any'
}

function suggestionText(s: CatalogSuggestion): string {
  const place =
    s.label && s.property ? `${s.label}.${s.property}`
    : s.property ? s.property
    : s.label ? s.label
    : ''
  const value = s.value !== undefined ? quote(s.value) : ''
  switch (s.reason) {
    case 'spelling':
      return value ? `stored spelling ${value}${place ? ` (${place})` : ''}` : `spelled alike: ${place}`
    case 'storedIn':
      return `stored in ${place}${value ? ` as ${value}` : ''}`
    case 'contains':
      return `stored value containing it: ${value}${place ? ` (${place})` : ''}`
    default:
      return [value, place && `(${place})`, s.reason && `[${s.reason}]`].filter(Boolean).join(' ')
  }
}

/** One line per warning: what the data does not hold, then what it does hold. */
export function formatCatalogWarning(w: CatalogWarning): string {
  let head: string
  switch (w.kind) {
    case 'unknownLabel':
      head = `No record has the label ${quote(w.label ?? w.labels?.[0])}`
      break
    case 'unknownProperty':
      head = `No ${where(w)} record has the property ${quote(w.property)}`
      break
    case 'unknownValue':
      head = `No ${where(w)} record stores ${quote(w.value)} in ${quote(w.property)}`
      break
    default:
      head = [w.kind, w.property && `property ${quote(w.property)}`, w.value !== undefined && quote(w.value)]
        .filter(Boolean)
        .join(': ')
  }
  const suggestions = (w.suggestions ?? []).map(suggestionText).filter(Boolean)
  return suggestions.length ? `${head}. Did you mean: ${suggestions.join('; ')}?` : `${head}.`
}

/**
 * The warnings as a text block for the model: they name the stored spelling, so the
 * fix is usually to re-run the query with it instead of reporting "nothing found".
 */
export function formatCatalogWarnings(warnings: CatalogWarning[]): string {
  if (!warnings.length) return ''
  return (
    'CATALOG WARNINGS: the query names something the data does not hold. ' +
    'Re-run it with the stored names/values below before answering; do not report "no results" without saying this.\n' +
    warnings.map((w) => `- ${formatCatalogWarning(w)}`).join('\n')
  )
}

// ─── Server errors ───────────────────────────────────────────────────────────

/** `code` and `details` of an SDK error: its own fields, else the parsed body. */
export function errorInfo(error: unknown): { status?: number; code?: string; details?: Record<string, any> } {
  if (!error || typeof error !== 'object') return {}
  const e = error as Record<string, any>
  const body = e.body && typeof e.body === 'object' ? e.body : undefined
  const nested = body?.error && typeof body.error === 'object' ? body.error : undefined
  const code = e.code ?? nested?.code ?? (typeof body?.code === 'string' ? body.code : undefined)
  const details = e.details ?? nested?.details ?? body?.details
  return {
    status: typeof e.status === 'number' ? e.status : undefined,
    code: typeof code === 'string' ? code : undefined,
    details: details && typeof details === 'object' ? details : undefined
  }
}

/**
 * A clear message for the errors the 3.0.14 engine explains in `details`: a unique
 * index conflict and a catalog check refusal. Anything else gives undefined.
 */
export function describeKnownError(error: unknown): string | undefined {
  const { status, code, details } = errorInfo(error)
  const e = error as Record<string, any> | undefined

  const label = e?.label ?? details?.label
  const property = e?.property ?? details?.property
  const recordId = e?.recordId ?? e?.record_id ?? details?.recordId
  if ((code === 'conflict' || status === 409) && label && property) {
    return (
      `Unique index conflict (409): another ${label} record${recordId ? ` (${recordId})` : ''} already holds this value of ` +
      `"${property}", and a unique index on ${label}.${property} allows one record per value. ` +
      'Nothing was written. Update that record instead (getRecord / updateRecord), or write a different value. ' +
      'When declaring a unique index, this means the existing data already repeats a value: remove the duplicates first.'
    )
  }

  const warnings = asWarnings(e?.warnings).length ? asWarnings(e?.warnings) : asWarnings(details?.warnings)
  if (warnings.length && (code === 'invalid_request' || status === 400 || status === undefined)) {
    return (
      'Refused by the strict catalog check (check: "strict"): nothing ran.\n' + formatCatalogWarnings(warnings)
    )
  }
  return undefined
}
