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
 * Every label with its properties in one read, from the live catalog: types, record and
 * exact distinct counts, numeric and date ranges, the values of properties holding few,
 * and relationship shapes.
 */
export async function getSchemaSummary(params: { labels?: string[]; fewValues?: number } = {}) {
  const result = await db.ai.getSchemaSummary(params)
  return result.data
}
