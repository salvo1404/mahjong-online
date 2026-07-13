import { describe, it, expect } from 'vitest'
import { calculateTai, calculatePayment } from './scoring'
import type { Tile } from './tiles'

function t(suit: 'bamboo' | 'circles' | 'characters', rank: number): Tile {
  return { id: rank, suit, rank }
}

describe('calculateTai', () => {
  it('awards self-draw tai', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),t('bamboo',9),
    ]
    const result = calculateTai(hand, [], true)
    expect(result.breakdown.some(b => b.labelZh === '自摸')).toBe(true)
  })

  it('awards all-sequences tai for all-chi hand', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),t('bamboo',9),
    ]
    const result = calculateTai(hand, [], false)
    expect(result.breakdown.some(b => b.labelZh === '平胡')).toBe(true)
  })

  it('awards flush tai for single-suit hand', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('bamboo',7),t('bamboo',8),t('bamboo',9),
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',4),
    ]
    const result = calculateTai(hand, [], false)
    expect(result.breakdown.some(b => b.labelZh === '清一色')).toBe(true)
  })

  it('total is sum of breakdown', () => {
    const hand = [
      t('bamboo',1),t('bamboo',2),t('bamboo',3),
      t('bamboo',4),t('bamboo',5),t('bamboo',6),
      t('circles',1),t('circles',2),t('circles',3),
      t('characters',7),t('characters',8),t('characters',9),
      t('bamboo',9),t('bamboo',9),
    ]
    const result = calculateTai(hand, [], true)
    expect(result.total).toBe(result.breakdown.reduce((s, b) => s + b.tai, 0))
  })
})

describe('calculatePayment', () => {
  it('self-draw: each loser pays tai*100', () => {
    const p = calculatePayment(3, true)
    expect(p.perLoser).toBe(300)
    expect(p.total).toBe(900)
  })
  it('discard win: total is tai*100*3', () => {
    const p = calculatePayment(2, false)
    expect(p.total).toBe(600)
  })
})
