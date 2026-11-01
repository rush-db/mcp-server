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

/**
 * Stored values matching a text across every property, with the label and property
 * holding each and its record count. Maps a word in a question to the value the data
 * actually stores; `match: 'similar'` finds near spellings.
 */
export async function searchValues(params: {
  text: string
  match?: 'contains' | 'prefix' | 'exact' | 'similar'
  labels?: string[]
  limit?: number
  minSimilarity?: number
}) {
  const result = await db.ai.searchValues(params)
  return result.data
}
