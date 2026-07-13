import { describe, it, expect } from 'vitest'
import { createInitialState, gameReducer } from './gameReducer'

describe('createInitialState', () => {
  it('deals 16 tiles to each player', () => {
    const state = createInitialState()
    state.players.forEach(p => {
      // flowers replaced immediately, so hand may be slightly smaller + flowers array populated
      expect(p.hand.length + p.flowers.length).toBeGreaterThanOrEqual(16)
    })
  })

  it('sets player scores to 1000', () => {
    const state = createInitialState()
    state.players.forEach(p => expect(p.score).toBe(1000))
  })

  it('starts in drawing phase with player 0 as current turn', () => {
    const state = createInitialState()
    expect(state.phase).toBe('drawing')
    expect(state.currentTurn).toBe(0)
  })
})

describe('DISCARD action', () => {
  it('moves tile from player hand to discards and advances turn', () => {
    const state = createInitialState()
    const tileToDiscard = state.players[0].hand[0]
    const next = gameReducer(state, { type: 'HUMAN_DISCARD', tile: tileToDiscard })
    expect(next.players[0].discards).toContainEqual(tileToDiscard)
    expect(next.players[0].hand).not.toContainEqual(tileToDiscard)
  })

  it('sets phase to claiming after HUMAN_DISCARD', () => {
    const state = createInitialState()
    const tileToDiscard = state.players[0].hand[0]
    const next = gameReducer(state, { type: 'HUMAN_DISCARD', tile: tileToDiscard })
    expect(next.phase).toBe('claiming')
  })

  it('sets lastDiscard correctly after HUMAN_DISCARD', () => {
    const state = createInitialState()
    const tileToDiscard = state.players[0].hand[0]
    const next = gameReducer(state, { type: 'HUMAN_DISCARD', tile: tileToDiscard })
    expect(next.lastDiscard).toEqual({ tile: tileToDiscard, from: 0 })
  })
})

describe('DRAW_TILE action', () => {
  it('adds a tile to the specified player hand', () => {
    const state = createInitialState()
    const handSizeBefore = state.players[0].hand.length
    const next = gameReducer(state, { type: 'DRAW_TILE', playerIndex: 0 })
    // Either hand grew (non-flower) or flowers grew (flower tile)
    expect(
      next.players[0].hand.length + next.players[0].flowers.length
    ).toBeGreaterThan(
      state.players[0].hand.length + state.players[0].flowers.length
    )
    expect(next.wall.length).toBe(state.wall.length - 1)
    void handSizeBefore
  })

  it('transitions to scoring when wall is empty', () => {
    const state = { ...createInitialState(), wall: [] }
    const next = gameReducer(state, { type: 'DRAW_TILE', playerIndex: 0 })
    expect(next.phase).toBe('scoring')
  })
})

describe('DECLARE_WIN action', () => {
  it('sets phase to scoring and records winner', () => {
    const state = createInitialState()
    const next = gameReducer(state, { type: 'DECLARE_WIN', playerIndex: 2, isSelfDraw: false })
    expect(next.phase).toBe('scoring')
    expect(next.winner).toBe(2)
  })
})

describe('NEXT_ROUND action', () => {
  it('resets to a fresh initial state', () => {
    const state = createInitialState()
    const next = gameReducer(state, { type: 'NEXT_ROUND' })
    expect(next.phase).toBe('drawing')
    expect(next.winner).toBeNull()
    next.players.forEach(p => expect(p.score).toBe(1000))
  })
})
