import { type Tile, tilesEqual } from './tiles'

export type MeldGroup = { type: 'seq' | 'tri' | 'pair'; tiles: Tile[] }

function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit)
    return a.rank - b.rank
  })
}

// Check if a sorted tile array (with pair already removed) can form all-melds
function checkMelds(sorted: Tile[]): boolean {
  if (sorted.length === 0) return true
  if (sorted.length % 3 !== 0) return false

  const tile = sorted[0]

  // try as triplet
  if (sorted.length >= 3 && tilesEqual(sorted[1], tile) && tilesEqual(sorted[2], tile)) {
    if (checkMelds(sorted.slice(3))) return true
  }

  // try as sequence start
  if (['bamboo', 'circles', 'characters'].includes(tile.suit)) {
    const i1 = sorted.findIndex((t, i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank + 1)
    const i2 = sorted.findIndex((t, i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank + 2)
    if (i1 !== -1 && i2 !== -1) {
      const rest = sorted.filter((_, i) => i !== 0 && i !== i1 && i !== i2)
      if (checkMelds(rest)) return true
    }
  }

  return false
}

export function isSevenPairs(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false
  const sorted = sortTiles(tiles)
  for (let i = 0; i < 14; i += 2) {
    if (!tilesEqual(sorted[i], sorted[i + 1])) return false
  }
  return true
}

export function isWinningHand(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false
  if (isSevenPairs(tiles)) return true
  const sorted = sortTiles(tiles)
  // Try each unique pair position as the head
  for (let i = 0; i < sorted.length - 1; i++) {
    // Skip duplicate pair candidates to avoid redundant checks
    if (i > 0 && tilesEqual(sorted[i], sorted[i - 1])) continue
    if (tilesEqual(sorted[i], sorted[i + 1])) {
      const remaining = [...sorted.slice(0, i), ...sorted.slice(i + 2)]
      if (checkMelds(remaining)) return true
    }
  }
  return false
}

export function findWinningDecompositions(tiles: Tile[]): MeldGroup[][] {
  if (!isWinningHand(tiles)) return []
  if (isSevenPairs(tiles)) {
    const sorted = sortTiles(tiles)
    const groups: MeldGroup[] = []
    for (let i = 0; i < 14; i += 2) {
      groups.push({ type: 'pair', tiles: [sorted[i], sorted[i + 1]] })
    }
    return [groups]
  }

  const results: MeldGroup[][] = []
  const sorted = sortTiles(tiles)

  // Try each unique pair as the head
  for (let i = 0; i < sorted.length - 1; i++) {
    if (i > 0 && tilesEqual(sorted[i], sorted[i - 1])) continue
    if (tilesEqual(sorted[i], sorted[i + 1])) {
      const pairGroup: MeldGroup = { type: 'pair', tiles: [sorted[i], sorted[i + 1]] }
      const remaining = [...sorted.slice(0, i), ...sorted.slice(i + 2)]
      recurseMelds(remaining, [pairGroup], results)
    }
  }

  return results
}

function recurseMelds(remaining: Tile[], current: MeldGroup[], results: MeldGroup[][]): void {
  if (remaining.length === 0) {
    results.push(current)
    return
  }
  const sorted = sortTiles(remaining)
  const tile = sorted[0]

  // triplet
  if (sorted.length >= 3 && tilesEqual(sorted[1], tile) && tilesEqual(sorted[2], tile)) {
    recurseMelds(sorted.slice(3), [...current, { type: 'tri', tiles: sorted.slice(0, 3) }], results)
  }

  // sequence
  if (['bamboo', 'circles', 'characters'].includes(tile.suit)) {
    const i1 = sorted.findIndex((t, i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank + 1)
    const i2 = sorted.findIndex((t, i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank + 2)
    if (i1 !== -1 && i2 !== -1) {
      const rest = sorted.filter((_, i) => i !== 0 && i !== i1 && i !== i2)
      recurseMelds(rest, [...current, { type: 'seq', tiles: [sorted[0], sorted[i1], sorted[i2]] }], results)
    }
  }
}

function countGroups(tiles: Tile[]): { sets: number; pairs: number; partial: number } {
  const sorted = sortTiles(tiles)
  const used = new Array(sorted.length).fill(false)
  let sets = 0
  let pairs = 0

  // greedy: triplets first
  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue
    let count = 1
    const matches = [i]
    for (let j = i + 1; j < sorted.length && count < 3; j++) {
      if (!used[j] && tilesEqual(sorted[j], sorted[i])) { matches.push(j); count++ }
    }
    if (count >= 3) { matches.slice(0, 3).forEach(k => { used[k] = true }); sets++; continue }
  }
  // sequences
  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue
    const s = sorted[i]
    if (!['bamboo', 'circles', 'characters'].includes(s.suit)) continue
    const n1 = sorted.findIndex((t, k) => !used[k] && k > i && t.suit === s.suit && t.rank === s.rank + 1)
    if (n1 === -1) continue
    const n2 = sorted.findIndex((t, k) => !used[k] && k > n1 && t.suit === s.suit && t.rank === s.rank + 2)
    if (n2 === -1) continue
    used[i] = used[n1] = used[n2] = true; sets++
  }
  // pairs
  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue
    for (let j = i + 1; j < sorted.length; j++) {
      if (!used[j] && tilesEqual(sorted[i], sorted[j])) { used[i] = used[j] = true; pairs++; break }
    }
  }
  // partial (pairs used as partial sets)
  const partial = pairs
  return { sets, pairs, partial }
}

export function shanten(tiles: Tile[]): number {
  if (isWinningHand(tiles)) return -1

  // seven pairs shanten
  const sorted = sortTiles(tiles)
  let pairs = 0
  for (let i = 0; i + 1 < sorted.length; i++) {
    if (tilesEqual(sorted[i], sorted[i + 1])) { pairs++; i++ }
  }
  const sevenPairsShanten = 6 - pairs

  // standard shanten: 8 - 2*sets - partial
  const { sets, partial } = countGroups(tiles)
  const standardShanten = 8 - 2 * sets - partial

  return Math.min(sevenPairsShanten, standardShanten)
}
