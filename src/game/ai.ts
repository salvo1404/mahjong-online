import { type Tile, type PlayerIndex } from './tiles'
import { shanten } from './hand'
import { getClaimOptions, type Meld, type ClaimOption } from './rules'

function tileIsolated(tile: Tile, hand: Tile[]): boolean {
  if (!['bamboo','circles','characters'].includes(tile.suit)) return true
  return !hand.some(t =>
    t !== tile && t.suit === tile.suit && Math.abs(t.rank - tile.rank) <= 2
  )
}

export function aiChooseDiscard(hand: Tile[]): Tile {
  let bestTile = hand[0]
  let bestShanten = Infinity

  for (const tile of hand) {
    const remaining = hand.filter(t => t !== tile)
    const s = shanten(remaining)
    if (s < bestShanten || (s === bestShanten && tileIsolated(tile, hand) && !tileIsolated(bestTile, hand))) {
      bestShanten = s
      bestTile = tile
    }
  }

  return bestTile
}

export function aiChooseClaim(
  hand: Tile[],
  melds: Meld[],
  discard: Tile,
  playerIndex: PlayerIndex,
  discarderIndex: PlayerIndex
): ClaimOption {
  const options = getClaimOptions(hand, melds, discard, playerIndex, discarderIndex)

  const win = options.find(o => o.type === 'win')
  if (win) return win

  const currentShanten = shanten(hand)

  for (const option of options) {
    if (option.type === 'pass') continue
    const claimTiles = option.tiles.filter(t => t !== discard)
    const remaining = hand.filter(h => !claimTiles.some(ct => ct === h))
    const newShanten = shanten(remaining)
    if (newShanten < currentShanten) return option
  }

  return { type: 'pass', tiles: [] }
}
