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
})
