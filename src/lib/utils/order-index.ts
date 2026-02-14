const GAP = 1024

export function getNewOrderIndex(
  items: { order_index: number }[],
  targetIndex: number
): number {
  if (items.length === 0) return GAP
  if (targetIndex === 0) return items[0].order_index / 2
  if (targetIndex >= items.length) return items[items.length - 1].order_index + GAP

  const before = items[targetIndex - 1].order_index
  const after = items[targetIndex].order_index
  return (before + after) / 2
}

export function needsRebalancing(items: { order_index: number }[]): boolean {
  for (let i = 1; i < items.length; i++) {
    if (items[i].order_index - items[i - 1].order_index < 0.001) return true
  }
  return false
}

export function rebalanceOrderIndices(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * GAP)
}
