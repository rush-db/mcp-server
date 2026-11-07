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

export async function updateRelation(params: {
  sourceId: string
  targetId?: string
  targetIds?: string[]
  relationType: string
  direction?: 'outgoing' | 'incoming'
  set?: Record<string, unknown>
  unset?: string[]
  types?: Record<string, 'string' | 'number' | 'boolean' | 'datetime'>
}) {
  const { sourceId, targetId, targetIds, relationType, direction = 'outgoing', set, unset, types } = params

  const targets: string[] =
    targetIds && targetIds.length > 0 ? targetIds
    : targetId ? [targetId]
    : []
  if (targets.length === 0) {
    return { success: false, message: 'No targetId(s) provided', updated: 0 }
  }
  if (!relationType) {
    return { success: false, message: 'relationType is required', updated: 0 }
  }
  if (Object.keys(set ?? {}).length === 0 && (unset ?? []).length === 0) {
    return { success: false, message: 'Nothing to change: pass set and/or unset', updated: 0 }
  }

  const response = await db.relationships.update({
    source: sourceId,
    target: targets,
    type: relationType,
    direction: direction === 'incoming' ? 'in' : 'out',
    ...(set && { set }),
    ...(unset && { unset }),
    ...(types && { types })
  })
  const updated = response.data?.updated ?? 0

  return {
    success: true,
    message:
      updated > 0 ?
        `Updated ${updated} '${relationType}' relationship(s) from '${sourceId}'`
      : `No '${relationType}' relationship found from '${sourceId}' to the given target(s); nothing changed`,
    updated
  }
}
