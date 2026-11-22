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

import { db } from '../util/db.js'
import { isFlatObject } from '../util/isFlatObject.js'

type BulkCreateRecordsArgs = {
  label: string
  data: Record<string, any>[]
  transactionId?: string
  options?: {
    mergeStrategy?: 'append' | 'rewrite'
    mergeBy?: string[]
    returnResult?: boolean
    skipEmptyValues?: boolean
  }
}

type BulkCreateRecordsResult = {
  message: string
  ids: string[]
  data: Record<string, any>[]
  total: number
}

// RushDB 3.0.14 loads fastest at about 5,000 flat rows per request (about 10,000
// nested documents); larger requests only grow server memory. Requests also stay
// well under the 16 MiB default body limit.
export const FLAT_BATCH_ROWS = 5_000
export const NESTED_BATCH_ROWS = 10_000
export const MAX_BATCH_BYTES = 8 * 1024 * 1024

/** Splits rows into batches of at most `maxRows` rows and about `maxBytes` of JSON. */
export function toBatches<T>(rows: T[], maxRows: number, maxBytes = MAX_BATCH_BYTES): T[][] {
  const batches: T[][] = []
  let current: T[] = []
  let bytes = 0
  for (const row of rows) {
    const size = Buffer.byteLength(JSON.stringify(row) ?? '', 'utf8') + 1
    if (current.length && (current.length >= maxRows || bytes + size > maxBytes)) {
      batches.push(current)
      current = []
      bytes = 0
    }
    current.push(row)
    bytes += size
  }
  if (current.length) batches.push(current)
  return batches
}

export async function bulkCreateRecords({
  label,
  data,
  transactionId,
  options
}: BulkCreateRecordsArgs): Promise<BulkCreateRecordsResult> {
  // Route to the correct SDK method based on data shape
  const allFlat = Array.isArray(data) && data.every(isFlatObject)
  const normalizedOptions = options ? { ...options } : {}

  // Ensure returnResult default true for MCP convenience if not specified
  if (normalizedOptions.returnResult === undefined) {
    normalizedOptions.returnResult = true
  }

  const batches = toBatches(data ?? [], allFlat ? FLAT_BATCH_ROWS : NESTED_BATCH_ROWS)
  const ids: string[] = []
  const records: Record<string, any>[] = []
  let total = 0

  for (const [i, batch] of batches.entries()) {
    let result: any
    try {
      result =
        allFlat ?
          await db.records.createMany({ label, data: batch, options: normalizedOptions }, transactionId)
        : await db.records.importJson({ label, data: batch, options: normalizedOptions }, transactionId)
    } catch (error) {
      // Earlier batches are already committed unless they ran in a transaction.
      if (i > 0 && !transactionId && error instanceof Error) {
        const note =
          `Batch ${i + 1} of ${batches.length} failed; the ${total} records of the ${i} ` +
          `batch${i === 1 ? '' : 'es'} before it were written and stay written.`
        ;(error as any).partialWrite = note
        error.message = `${error.message} (${note})`
      }
      throw error
    }
    ids.push(...result.data.map((record: any) => record.id))
    records.push(...result.data.map((record: any) => record.data))
    total += result.total ?? result.data.length
  }

  const batched = batches.length > 1 ? ` in ${batches.length} batches` : ''
  return {
    message: `Successfully created ${ids.length} records with label '${label}'${batched}`,
    ids,
    data: records,
    total
  }
}
