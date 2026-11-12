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
 * Starts a sync of a connection now: every enabled stream, or the ones named.
 * `full` ignores stored cursors and reads everything again. Returns the queued run.
 */
export async function syncConnection(params: { id: string; streams?: string[]; full?: boolean }) {
  const result = await db.connections.sync(params.id, {
    ...(params.streams?.length ? { streams: params.streams } : {}),
    ...(params.full === undefined ? {} : { full: params.full })
  })
  return result.data
}
