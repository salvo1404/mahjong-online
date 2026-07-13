import type { Tile } from './tiles'
import { isSevenPairs, findWinningDecompositions } from './hand'
import type { Meld } from './rules'

export const TAI_PER_CHIP = 100

export type TaiResult = {
  total: number
  breakdown: { label: string; labelZh: string; tai: number }[]
}

export function calculateTai(hand: Tile[], melds: Meld[], isSelfDraw: boolean): TaiResult {
  const breakdown: { label: string; labelZh: string; tai: number }[] = []
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)]

  const add = (label: string, labelZh: string, tai: number) =>
    breakdown.push({ label, labelZh, tai })

  if (isSelfDraw) add('Self-draw', '自摸', 1)
  if (melds.length === 0) add('Concealed hand', '門前清', 1)

  if (isSevenPairs(hand)) {
    add('Seven pairs', '七對', 4)
    const total = breakdown.reduce((s, b) => s + b.tai, 0)
    return { total, breakdown }
  }

  const decomps = findWinningDecompositions([...hand])
  if (decomps.length > 0) {
    const decomp = decomps[0]
    const allTriOrPair = decomp.every(g => g.type === 'tri' || g.type === 'pair')
    const allSeq = decomp.filter(g => g.type !== 'pair').every(g => g.type === 'seq')

    if (allTriOrPair && decomp.filter(g => g.type === 'tri').length === 4) {
      add('All triplets', '碰碰胡', 4)
    } else if (allSeq) {
      add('All sequences', '平胡', 1)
    }
  }

  // Flush: all tiles same suit (excluding flowers)
  const nonFlowerSuits = new Set(allTiles.filter(t => t.suit !== 'flower').map(t => t.suit))
  if (nonFlowerSuits.size === 1) {
    const suit = [...nonFlowerSuits][0]
    if (['bamboo', 'circles', 'characters'].includes(suit)) {
      add('Flush', '清一色', 4)
    } else {
      add('All honors', '字一色', 8)
    }
  }

  // Big three dragons: triplet of all 3 dragon types in melds+hand
  const dragonCounts = [1, 2, 3].map(r =>
    allTiles.filter(t => t.suit === 'dragon' && t.rank === r).length
  )
  if (dragonCounts.every(c => c >= 3)) add('Big three dragons', '大三元', 16)

  const total = breakdown.reduce((s, b) => s + b.tai, 0)
  return { total, breakdown }
}

export function calculatePayment(tai: number, isSelfDraw: boolean): { perLoser: number; total: number } {
  const perLoser = tai * TAI_PER_CHIP
  // For self-draw: each of 3 losers pays perLoser; total = perLoser * 3
  // For discard win: discarder pays all 3 shares; total = perLoser * 3
  const total = perLoser * 3
  return { perLoser, total }
}
