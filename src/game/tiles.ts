export type Suit = 'bamboo' | 'circles' | 'characters' | 'wind' | 'dragon' | 'flower'
export type Tile = { id: number; suit: Suit; rank: number }
export type PlayerIndex = 0 | 1 | 2 | 3

const WIND_LABELS = ['', 'East', 'South', 'West', 'North']
const DRAGON_LABELS = ['', '中', '發', '白']
const SUIT_PREFIX: Partial<Record<Suit, string>> = {
  bamboo: 'B', circles: 'C', characters: 'M',
}

export function tileLabel(tile: Tile): string {
  if (tile.suit === 'wind') return WIND_LABELS[tile.rank]
  if (tile.suit === 'dragon') return DRAGON_LABELS[tile.rank]
  if (tile.suit === 'flower') return tile.rank <= 4 ? `F${tile.rank}` : `S${tile.rank - 4}`
  return `${SUIT_PREFIX[tile.suit]}${tile.rank}`
}

export function isFlower(tile: Tile): boolean {
  return tile.suit === 'flower'
}

export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

export function buildWall(): Tile[] {
  const tiles: Tile[] = []
  let id = 0

  const suited: Suit[] = ['bamboo', 'circles', 'characters']
  for (const suit of suited) {
    for (let rank = 1; rank <= 9; rank++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({ id: id++, suit, rank })
      }
    }
  }
  // winds 1-4, 4 copies each
  for (let rank = 1; rank <= 4; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: id++, suit: 'wind', rank })
    }
  }
  // dragons 1-3, 4 copies each
  for (let rank = 1; rank <= 3; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: id++, suit: 'dragon', rank })
    }
  }
  // flowers 1-4, seasons 5-8 (one copy each)
  for (let rank = 1; rank <= 8; rank++) {
    tiles.push({ id: id++, suit: 'flower', rank })
  }

  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }

  return tiles
}
