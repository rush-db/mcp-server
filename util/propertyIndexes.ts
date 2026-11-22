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

import { db } from './db.js'

// Ordered and unique property indexes (RushDB 3.0.14+), through the SDK's
// `db.indexes`. Text indexes stay in db.textIndexes, embedding indexes in db.ai.indexes.

export type PropertyIndex = {
  name: string
  label: string
  property: string
  kind?: 'ordered' | 'unique'
  unique: boolean
  status: 'building' | 'ready' | 'dropping'
  [key: string]: unknown
}

export function indexesApi() {
  const api = db.indexes
  if (!api || typeof api.create !== 'function') {
    throw new Error(
      'Ordered and unique indexes are not available: this MCP server\'s RushDB SDK has no db.indexes. Update the MCP server; the indexes also need a RushDB server on 3.0.14 or later.'
    )
  }
  return api
}

export const withUnique = (index: any): PropertyIndex =>
  index && typeof index === 'object' ?
    { ...index, unique: typeof index.unique === 'boolean' ? index.unique : index.kind === 'unique' }
  : index
