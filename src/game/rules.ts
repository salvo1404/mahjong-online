import { type Tile, type PlayerIndex, tilesEqual } from './tiles'
import { isWinningHand } from './hand'

export type ClaimType = 'win' | 'kan' | 'pon' | 'chi' | 'pass'
export type Meld = { type: 'chi' | 'pon' | 'kan'; tiles: Tile[]; from: PlayerIndex }
export type ClaimOption = { type: ClaimType; tiles: Tile[] }

function isLeftOf(claimer: PlayerIndex, discarder: PlayerIndex): boolean {
  return (discarder + 1) % 4 === claimer
}

export function getClaimOptions(
  hand: Tile[],
  melds: Meld[],
  discard: Tile,
  playerIndex: PlayerIndex,
  discarderIndex: PlayerIndex
): ClaimOption[] {
  const options: ClaimOption[] = [{ type: 'pass', tiles: [] }]

  // Win check
  if (isWinningHand([...hand, discard], melds.length)) {
    options.push({ type: 'win', tiles: [discard] })
  }

  const matching = hand.filter(t => tilesEqual(t, discard))

  // Kan (4 matching in hand)
  if (matching.length >= 3) {
    options.push({ type: 'kan', tiles: [matching[0], matching[1], matching[2], discard] })
  }

  // Pon (2 matching in hand)
  if (matching.length >= 2) {
    options.push({ type: 'pon', tiles: [matching[0], matching[1], discard] })
  }

  // Chi (sequence, left player only, suited tiles only)
  if (
    isLeftOf(playerIndex, discarderIndex) &&
    ['bamboo', 'circles', 'characters'].includes(discard.suit)
  ) {
    const suit = discard.suit as 'bamboo' | 'circles' | 'characters'
    const r = discard.rank
    const seqCombos = [
      [r - 2, r - 1], [r - 1, r + 1], [r + 1, r + 2],
    ]
    for (const [a, b] of seqCombos) {
      const tA = hand.find(t => t.suit === suit && t.rank === a)
      const tB = hand.find(t => t.suit === suit && t.rank === b && t !== tA)
      if (tA && tB) {
        const seq = [tA, tB, discard].sort((x, y) => x.rank - y.rank)
        options.push({ type: 'chi', tiles: seq })
      }
    }
  }

  return options
}
