//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  // Vendored Stageshow kit (MIT), kept as upstream ships it
  { ignores: ['src/components/stageshow/**'] },
  ...tanstackConfig,
]
