// isMain(import.meta.url): true when this module is the script node was started with. Compares real
// paths on both sides, because ~ is ~ and the tree lives under ~, so a
// plain string compare is false whenever the two spellings differ and the script exits 0 having done
// nothing (plan-check, context-spend, verify-sweep did exactly that). A missing or odd argv[1] — a
// module imported from `node -e`, a test runner — is false, never a throw.
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function isMain(metaUrl) {
  try {
    return Boolean(process.argv[1]) && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(metaUrl))
  } catch {
    return false
  }
}
