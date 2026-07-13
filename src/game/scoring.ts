import type { Tile } from './tiles'
import { isSevenPairs, findWinningDecompositions, type MeldGroup } from './hand'
import type { Meld } from './rules'

export const TAI_PER_CHIP = 100

export type TaiResult = {
  total: number
  breakdown: { label: string; labelZh: string; tai: number }[]
}

export function calculateTai(hand: Tile[], melds: Meld[], isSelfDraw: boolean): TaiResult {
  const breakdown: TaiResult['breakdown'] = []

  // Concealed hand tiles for decomposition
  const allTiles = [...hand]
  const decomps = findWinningDecompositions(allTiles, melds.length)

  // Convert exposed melds to MeldGroup[] for structural pattern checking
  const exposedMelds: MeldGroup[] = melds.map(m => ({
    type: m.type === 'chi' ? 'seq' : 'tri',
    tiles: m.tiles,
  }))

  if (decomps.length > 0 || isSevenPairs(allTiles)) {
    // Self-draw bonus
    if (isSelfDraw) breakdown.push({ label: 'Self-draw', labelZh: '自摸', tai: 1 })

    // Concealed hand bonus (no exposed melds)
    if (melds.length === 0) breakdown.push({ label: 'Concealed hand', labelZh: '門前清', tai: 1 })

    if (isSevenPairs(allTiles)) {
      breakdown.push({ label: 'Seven pairs', labelZh: '七對', tai: 4 })
    } else {
      // Check structural patterns across ALL melds (concealed decomp + exposed)
      for (const decomp of decomps) {
        const allMelds = [...decomp.filter(g => g.type !== 'pair'), ...exposedMelds]

        const isAllSeq = allMelds.every(g => g.type === 'seq')
        const isAllTri = allMelds.every(g => g.type === 'tri')

        if (isAllTri && !breakdown.some(b => b.labelZh === '碰碰胡'))
          breakdown.push({ label: 'All triplets', labelZh: '碰碰胡', tai: 4 })
        if (isAllSeq && !breakdown.some(b => b.labelZh === '平胡'))
          breakdown.push({ label: 'All sequences', labelZh: '平胡', tai: 1 })
        break // one decomposition is sufficient
      }
    }

    // Flush (清一色): all tiles (including melds) share a single suited suit
    const allGameTiles = [...allTiles, ...melds.flatMap(m => m.tiles)]
    const suits = new Set(allGameTiles.filter(t => t.suit !== 'flower').map(t => t.suit))
    if (suits.size === 1 && !['wind', 'dragon'].includes([...suits][0]))
      breakdown.push({ label: 'Flush', labelZh: '清一色', tai: 4 })

    // All honors (字一色): every tile is wind or dragon
    const isAllHonor = allGameTiles.every(t => t.suit === 'wind' || t.suit === 'dragon')
    if (isAllHonor) breakdown.push({ label: 'All honors', labelZh: '字一色', tai: 8 })

    // Big three dragons (大三元): dragon triplets across concealed + exposed
    const dragonTris = [
      ...decomps[0]?.filter(g => g.type === 'tri' && g.tiles[0].suit === 'dragon') ?? [],
      ...exposedMelds.filter(g => g.type === 'tri' && g.tiles[0].suit === 'dragon'),
    ]
    if (dragonTris.length >= 3) breakdown.push({ label: 'Big three dragons', labelZh: '大三元', tai: 16 })
  }

  return { total: breakdown.reduce((s, b) => s + b.tai, 0), breakdown }
}

export function calculatePayment(tai: number, _isSelfDraw: boolean): { perLoser: number; total: number } {
  const perLoser = tai * TAI_PER_CHIP
  // For self-draw: each of 3 losers pays perLoser; total = perLoser * 3
  // For discard win: discarder pays all 3 shares; total = perLoser * 3
  const total = perLoser * 3
  return { perLoser, total }
}
