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

import type { Handler, Hono } from 'hono'

export const OPENAI_APPS_CHALLENGE_PATH = '/.well-known/openai-apps-challenge'

/**
 * Registers the /.well-known routes. Routes this server answers itself must be
 * registered before the catch-all that proxies the rest to platform/core, or the
 * proxy claims them.
 *
 * The OpenAI domain verification token comes from OPENAI_APPS_CHALLENGE_TOKEN
 * (each portal draft issues a new one). It is served as plain text; without it
 * the path returns 404.
 */
export function registerWellKnownRoutes(
  app: Hono,
  proxy: Handler,
  challengeToken = process.env.OPENAI_APPS_CHALLENGE_TOKEN
) {
  const token = challengeToken?.trim()
  app.get(OPENAI_APPS_CHALLENGE_PATH, (c) => (token ? c.text(token) : c.notFound()))
  app.get('/.well-known/*', proxy)
}
