import { describe, it, expect } from 'vitest'
import { aiChooseDiscard, aiChooseClaim } from './ai'
import type { Tile } from './tiles'

function t(suit: 'bamboo' | 'circles' | 'characters', rank: number): Tile {
  return { id: rank, suit, rank }
}
function wind(rank: number): Tile { return { id: rank+100, suit: 'wind', rank } }

describe('aiChooseDiscard', () => {
  it('discards isolated honor tile over useful suited tile', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),t('bamboo',9),
      wind(1),
    ]
    const discard = aiChooseDiscard(hand)
    expect(discard.suit).toBe('wind')
  })
})

describe('aiChooseClaim', () => {
  it('always wins when possible', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),
    ]
    const discard = t('bamboo',9)
    const claim = aiChooseClaim(hand, [], discard, 1, 0)
    expect(claim.type).toBe('win')
  })

  it('passes when claim does not help', () => {
    const hand = [t('bamboo',1), t('circles',3), t('characters',9)]
    const discard = t('wind' as any, 2)
    const claim = aiChooseClaim(hand, [], discard, 1, 0)
    expect(claim.type).toBe('pass')
  })
})
