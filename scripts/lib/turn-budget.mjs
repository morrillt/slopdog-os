// Shared estimate-points → turn budget for desk panels and Stop hooks (T-480).
const MAX_BY_POINTS = new Map([
  [1, 3],
  [2, 5],
  [3, 7],
  [5, 12],
  [8, 20],
])

export function maxTurnsForEstimate(points) {
  const n = Number(points)
  if (!Number.isFinite(n)) return null
  return MAX_BY_POINTS.get(n) ?? null
}
