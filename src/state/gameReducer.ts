import { buildWall, isFlower, type Tile, type PlayerIndex } from '../game/tiles'
import type { Meld, ClaimOption } from '../game/rules'

export type Player = {
  hand: Tile[]
  melds: Meld[]
  discards: Tile[]
  flowers: Tile[]
  score: number
}

export type GameState = {
  players: [Player, Player, Player, Player]
  wall: Tile[]
  deadWall: Tile[]
  currentTurn: PlayerIndex
  phase: 'drawing' | 'claiming' | 'scoring' | 'gameover'
  lastDiscard: { tile: Tile; from: PlayerIndex } | null
  round: { wind: 'east' | 'south'; dealer: PlayerIndex; roundNum: number }
  pendingClaims: ClaimOption[]
  winner: PlayerIndex | null
  isSelfDraw: boolean
}

export type GameAction =
  | { type: 'HUMAN_DISCARD'; tile: Tile }
  | { type: 'AI_DISCARD'; playerIndex: PlayerIndex; tile: Tile }
  | { type: 'HUMAN_CLAIM'; claim: ClaimOption }
  | { type: 'AI_CLAIM'; playerIndex: PlayerIndex; claim: ClaimOption }
  | { type: 'DRAW_TILE'; playerIndex: PlayerIndex }
  | { type: 'NEXT_ROUND' }
  | { type: 'DECLARE_WIN'; playerIndex: PlayerIndex; isSelfDraw: boolean }
  | { type: 'ADVANCE_TURN' }

function makePlayer(): Player {
  return { hand: [], melds: [], discards: [], flowers: [], score: 1000 }
}

/**
 * Draw a replacement tile for a flower from the dead wall.
 * Falls back to the live wall tail if dead wall is exhausted.
 */
function drawReplacement(
  wall: Tile[],
  deadWall: Tile[]
): { tile: Tile; wall: Tile[]; deadWall: Tile[] } {
  if (deadWall.length > 0) {
    return {
      tile: deadWall[deadWall.length - 1],
      wall,
      deadWall: deadWall.slice(0, -1),
    }
  }
  // fallback: take from live wall tail
  return {
    tile: wall[wall.length - 1],
    wall: wall.slice(0, -1),
    deadWall,
  }
}

/**
 * Given a batch of tiles dealt to a player, replace all flowers immediately
 * by drawing from the dead wall (or fallback), recursively handling the
 * case where a replacement tile is itself a flower.
 */
function replaceFlowers(
  tiles: Tile[],
  wall: Tile[],
  deadWall: Tile[]
): { hand: Tile[]; flowers: Tile[]; wall: Tile[]; deadWall: Tile[] } {
  let hand: Tile[] = []
  let flowers: Tile[] = []
  let w = wall
  let dw = deadWall

  // Separate flowers from non-flowers
  for (const tile of tiles) {
    if (isFlower(tile)) {
      flowers.push(tile)
    } else {
      hand.push(tile)
    }
  }

  // For each flower found, draw a replacement (recursively if replacement is also a flower)
  let i = 0
  while (i < flowers.length) {
    const { tile, wall: newW, deadWall: newDw } = drawReplacement(w, dw)
    w = newW
    dw = newDw
    if (isFlower(tile)) {
      flowers.push(tile) // will be replaced in next iteration
    } else {
      hand.push(tile)
    }
    i++
  }

  return { hand, flowers, wall: w, deadWall: dw }
}

export function createInitialState(): GameState {
  const fullWall = buildWall()
  // Dead wall: first 16 tiles of the shuffled wall
  let deadWall = fullWall.splice(0, 16)
  let wall = fullWall

  // Deal 16 tiles to each player in column-style dealing
  const rawHands: Tile[][] = [[], [], [], []]
  for (let round = 0; round < 16; round++) {
    for (let p = 0; p < 4; p++) {
      rawHands[p].push(wall.pop()!)
    }
  }

  const players: [Player, Player, Player, Player] = [
    makePlayer(), makePlayer(), makePlayer(), makePlayer(),
  ]

  for (let p = 0; p < 4; p++) {
    const { hand, flowers, wall: newWall, deadWall: newDw } = replaceFlowers(
      rawHands[p],
      wall,
      deadWall
    )
    wall = newWall
    deadWall = newDw
    players[p] = { ...players[p], hand, flowers }
  }

  return {
    players,
    wall,
    deadWall,
    currentTurn: 0,
    phase: 'drawing',
    lastDiscard: null,
    round: { wind: 'east', dealer: 0, roundNum: 1 },
    pendingClaims: [],
    winner: null,
    isSelfDraw: false,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'HUMAN_DISCARD': {
      const players = state.players.map((p, i) => {
        if (i !== 0) return p
        return {
          ...p,
          hand: p.hand.filter(t => t.id !== action.tile.id),
          discards: [...p.discards, action.tile],
        }
      }) as GameState['players']
      return {
        ...state,
        players,
        lastDiscard: { tile: action.tile, from: 0 },
        phase: 'claiming',
        currentTurn: 1,
      }
    }

    case 'AI_DISCARD': {
      const { playerIndex, tile } = action
      const players = state.players.map((p, i) => {
        if (i !== playerIndex) return p
        return {
          ...p,
          hand: p.hand.filter(t => t.id !== tile.id),
          discards: [...p.discards, tile],
        }
      }) as GameState['players']
      const next = ((playerIndex + 1) % 4) as PlayerIndex
      return {
        ...state,
        players,
        lastDiscard: { tile, from: playerIndex },
        phase: 'claiming',
        currentTurn: next,
      }
    }

    case 'DRAW_TILE': {
      const { playerIndex } = action
      if (state.wall.length === 0) return { ...state, phase: 'scoring' }
      let tile = state.wall[state.wall.length - 1]
      let newWall = state.wall.slice(0, -1)
      let newDeadWall = [...state.deadWall]
      let flowers: Tile[] = []

      // Replace flowers immediately
      while (isFlower(tile)) {
        flowers.push(tile)
        // Draw replacement from dead wall, or live wall if dead wall empty
        if (newDeadWall.length > 0) {
          tile = newDeadWall[newDeadWall.length - 1]
          newDeadWall = newDeadWall.slice(0, -1)
        } else if (newWall.length > 0) {
          tile = newWall[newWall.length - 1]
          newWall = newWall.slice(0, -1)
        } else {
          return { ...state, phase: 'scoring' }
        }
      }

      const players = state.players.map((p, i) => {
        if (i !== playerIndex) return p
        return {
          ...p,
          hand: [...p.hand, tile],
          flowers: [...p.flowers, ...flowers],
        }
      }) as GameState['players']
      return { ...state, players, wall: newWall, deadWall: newDeadWall, phase: 'drawing' }
    }

    case 'HUMAN_CLAIM': {
      if (action.claim.type === 'pass') {
        return { ...state, pendingClaims: [], phase: 'drawing' }
      }
      if (action.claim.type === 'win') {
        const winnerHand = state.lastDiscard
          ? [...state.players[0].hand, state.lastDiscard.tile]
          : state.players[0].hand
        const newPlayers = state.players.map((p, i) =>
          i === 0 ? { ...p, hand: winnerHand } : p
        ) as [Player, Player, Player, Player]
        return { ...state, players: newPlayers, phase: 'scoring', winner: 0, isSelfDraw: false }
      }
      const discard = state.lastDiscard!.tile
      // tiles in claim minus the discard itself = tiles taken from hand
      const claimTiles = action.claim.tiles.filter(t => t.id !== discard.id)
      const meld: Meld = {
        type: action.claim.type as 'chi' | 'pon' | 'kan',
        tiles: action.claim.tiles,
        from: state.lastDiscard!.from,
      }
      const players = state.players.map((p, i) => {
        if (i !== 0) return p
        return {
          ...p,
          hand: p.hand.filter(h => !claimTiles.some(ct => ct.id === h.id)),
          melds: [...p.melds, meld],
        }
      }) as GameState['players']
      return { ...state, players, phase: 'drawing', pendingClaims: [] }
    }

    case 'AI_CLAIM': {
      const { playerIndex, claim } = action
      if (claim.type === 'pass') return state
      if (claim.type === 'win') {
        return { ...state, phase: 'scoring', winner: playerIndex }
      }
      const discard = state.lastDiscard!.tile
      const claimTiles = claim.tiles.filter(t => t.id !== discard.id)
      const meld: Meld = {
        type: claim.type as 'chi' | 'pon' | 'kan',
        tiles: claim.tiles,
        from: state.lastDiscard!.from,
      }
      const players = state.players.map((p, i) => {
        if (i !== playerIndex) return p
        return {
          ...p,
          hand: p.hand.filter(h => !claimTiles.some(ct => ct.id === h.id)),
          melds: [...p.melds, meld],
        }
      }) as GameState['players']
      return { ...state, players, phase: 'drawing', pendingClaims: [] }
    }

    case 'DECLARE_WIN': {
      const winner = action.playerIndex
      const isSelfDraw = action.isSelfDraw
      const winnerPlayer = state.players[winner]
      const newHand = isSelfDraw
        ? winnerPlayer.hand
        : state.lastDiscard
          ? [...winnerPlayer.hand, state.lastDiscard.tile]
          : winnerPlayer.hand
      const newPlayers = state.players.map((p, i) =>
        i === winner ? { ...p, hand: newHand } : p
      ) as [Player, Player, Player, Player]
      return {
        ...state,
        players: newPlayers,
        phase: 'scoring',
        winner,
        isSelfDraw,
      }
    }

    case 'ADVANCE_TURN': {
      return { ...state, phase: 'drawing' }
    }

    case 'NEXT_ROUND': {
      return createInitialState()
    }

    default:
      return state
  }
}
