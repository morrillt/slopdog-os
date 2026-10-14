// herdr-route.mjs — prefix herdr argv with --machine when the target is not this box.
import { localMachineLabel } from '../registry.mjs'

export { localMachineLabel }

export function machineForLane(lane) {
  if (!lane) return null
  return lane.machine ?? lane.host ?? null
}

export function isRemoteMachine(machine) {
  return Boolean(machine && machine !== localMachineLabel())
}

/** argv for `herdr` (or `spawn('herdr', argv)`): adds --machine when needed. */
export function herdrArgv(machine, ...args) {
  if (isRemoteMachine(machine)) return ['--machine', machine, ...args]
  return args
}
