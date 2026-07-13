// src/game/hand.test.ts
import { describe, it, expect } from 'vitest'
import { shanten, isWinningHand, isSevenPairs, findWinningDecompositions } from './hand'
import type { Tile } from './tiles'

function t(suit: 'bamboo' | 'circles' | 'characters', rank: number): Tile {
  return { id: rank, suit, rank }
}
function wind(rank: number): Tile { return { id: rank + 100, suit: 'wind', rank } }
function dragon(rank: number): Tile { return { id: rank + 200, suit: 'dragon', rank } }

describe('isWinningHand', () => {
  it('accepts 4 sequences + 1 pair', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),t('bamboo',9),
    ]
    expect(isWinningHand(hand)).toBe(true)
  })
  it('rejects incomplete hand', () => {
    const hand = [t('bamboo',1),t('bamboo',2),t('bamboo',3)]
    expect(isWinningHand(hand)).toBe(false)
  })
  it('with meldCount=1 accepts 11-tile concealed hand (3 sets + pair)', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('bamboo',9),t('bamboo',9),
    ]
    expect(isWinningHand(hand, 1)).toBe(true)
  })
  it('with meldCount=1 rejects 11-tile hand that is not a win', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('bamboo',8),t('bamboo',9),
    ]
    expect(isWinningHand(hand, 1)).toBe(false)
  })
})

describe('isSevenPairs', () => {
  it('accepts 7 pairs', () => {
    const hand = [
      t('bamboo',1),t('bamboo',1),
      t('bamboo',2),t('bamboo',2),
      t('circles',3),t('circles',3),
      t('circles',4),t('circles',4),
      t('characters',5),t('characters',5),
      wind(1),wind(1),
      dragon(1),dragon(1),
    ]
    expect(isSevenPairs(hand)).toBe(true)
  })
  it('rejects 6 pairs + 2 singles', () => {
    const hand = [
      t('bamboo',1),t('bamboo',1),
      t('bamboo',2),t('bamboo',2),
      t('circles',3),t('circles',3),
      t('circles',4),t('circles',4),
      t('characters',5),t('characters',5),
      wind(1),wind(1),
      dragon(1),dragon(2),
    ]
    expect(isSevenPairs(hand)).toBe(false)
  })
})

describe('shanten', () => {
  it('returns -1 for complete winning hand', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),t('bamboo',9),
    ]
    expect(shanten(hand)).toBe(-1)
  })
  it('returns 0 for tenpai (one tile away)', () => {
    // 3 complete sets + waiting for pair
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),
    ]
    expect(shanten(hand)).toBe(0)
  })
})

describe('findWinningDecompositions', () => {
  it('returns one decomposition for a standard 4-set + pair hand', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),t('bamboo',9),
    ]
    const decomps = findWinningDecompositions(hand)
    expect(decomps.length).toBeGreaterThan(0)
    const first = decomps[0]
    expect(first).toHaveLength(5) // 4 sets + 1 pair
    expect(first.filter(g => g.type === 'pair')).toHaveLength(1)
    expect(first.every(g => g.tiles.length >= 2)).toBe(true)
  })

  it('returns 7 pairs for a seven-pairs hand', () => {
    const hand = [
      t('bamboo',1),t('bamboo',1),
      t('bamboo',2),t('bamboo',2),
      t('circles',3),t('circles',3),
      t('circles',4),t('circles',4),
      t('characters',5),t('characters',5),
      wind(1),wind(1),
      dragon(1),dragon(1),
    ]
    const decomps = findWinningDecompositions(hand)
    expect(decomps.length).toBe(1)
    expect(decomps[0]).toHaveLength(7)
    expect(decomps[0].every(g => g.type === 'pair')).toBe(true)
  })

  it('returns empty for non-winning hand', () => {
    const hand = [t('bamboo',1),t('bamboo',2),t('circles',9)]
    expect(findWinningDecompositions(hand)).toHaveLength(0)
  })
})
