import { describe, it, expect } from 'vitest'
import { getClaimOptions } from './rules'
import type { Tile } from './tiles'

function t(suit: 'bamboo' | 'circles' | 'characters', rank: number): Tile {
  return { id: rank, suit, rank }
}

describe('getClaimOptions', () => {
  it('allows pon when hand has 2 matching tiles', () => {
    const hand = [t('bamboo', 5), t('bamboo', 5), t('circles', 1)]
    const discard = t('bamboo', 5)
    const opts = getClaimOptions(hand, [], discard, 1, 0)
    expect(opts.some(o => o.type === 'pon')).toBe(true)
  })

  it('allows chi only for left player (discarder is index 3, claimer is 0)', () => {
    const hand = [t('bamboo', 4), t('bamboo', 5), t('circles', 1)]
    const discard = t('bamboo', 3)
    // player 0 is left of player 3
    const opts = getClaimOptions(hand, [], discard, 0, 3)
    expect(opts.some(o => o.type === 'chi')).toBe(true)
  })

  it('does not allow chi for non-left player', () => {
    const hand = [t('bamboo', 4), t('bamboo', 5), t('circles', 1)]
    const discard = t('bamboo', 3)
    // player 0 is NOT left of player 1
    const opts = getClaimOptions(hand, [], discard, 0, 1)
    expect(opts.some(o => o.type === 'chi')).toBe(false)
  })

  it('always includes pass', () => {
    const hand = [t('circles', 1), t('circles', 2)]
    const discard = t('bamboo', 9)
    const opts = getClaimOptions(hand, [], discard, 1, 0)
    expect(opts.some(o => o.type === 'pass')).toBe(true)
  })

  it('allows win when hand + discard forms a winning hand', () => {
    // 13-tile tenpai hand: 4 complete sets + waiting for pair
    const hand = [
      { id: 1, suit: 'bamboo' as const, rank: 1 },
      { id: 2, suit: 'bamboo' as const, rank: 2 },
      { id: 3, suit: 'bamboo' as const, rank: 3 },
      { id: 4, suit: 'bamboo' as const, rank: 4 },
      { id: 5, suit: 'bamboo' as const, rank: 5 },
      { id: 6, suit: 'bamboo' as const, rank: 6 },
      { id: 7, suit: 'circles' as const, rank: 1 },
      { id: 8, suit: 'circles' as const, rank: 2 },
      { id: 9, suit: 'circles' as const, rank: 3 },
      { id: 10, suit: 'characters' as const, rank: 7 },
      { id: 11, suit: 'characters' as const, rank: 8 },
      { id: 12, suit: 'characters' as const, rank: 9 },
      { id: 13, suit: 'bamboo' as const, rank: 9 },
    ]
    const discard = { id: 14, suit: 'bamboo' as const, rank: 9 }
    const opts = getClaimOptions(hand, [], discard, 1, 0)
    expect(opts.some(o => o.type === 'win')).toBe(true)
  })

  it('allows kan when hand has 3 matching tiles', () => {
    const hand = [
      { id: 1, suit: 'bamboo' as const, rank: 5 },
      { id: 2, suit: 'bamboo' as const, rank: 5 },
      { id: 3, suit: 'bamboo' as const, rank: 5 },
      { id: 4, suit: 'circles' as const, rank: 1 },
    ]
    const discard = { id: 5, suit: 'bamboo' as const, rank: 5 }
    const opts = getClaimOptions(hand, [], discard, 1, 0)
    expect(opts.some(o => o.type === 'kan')).toBe(true)
    const kanOpt = opts.find(o => o.type === 'kan')!
    expect(kanOpt.tiles).toHaveLength(4)
  })
})
