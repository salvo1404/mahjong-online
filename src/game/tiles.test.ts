import { describe, it, expect } from 'vitest'
import { buildWall, isFlower, tilesEqual, tileLabel, type Tile } from './tiles'

describe('buildWall', () => {
  it('produces 144 tiles', () => {
    expect(buildWall()).toHaveLength(144)
  })
  it('has 36 bamboo tiles', () => {
    expect(buildWall().filter(t => t.suit === 'bamboo')).toHaveLength(36)
  })
  it('has 8 flower tiles', () => {
    expect(buildWall().filter(t => t.suit === 'flower')).toHaveLength(8)
  })
  it('assigns unique ids', () => {
    const wall = buildWall()
    const ids = new Set(wall.map(t => t.id))
    expect(ids.size).toBe(144)
  })
})

describe('isFlower', () => {
  it('returns true for flower suit', () => {
    expect(isFlower({ id: 0, suit: 'flower', rank: 1 })).toBe(true)
  })
  it('returns false for bamboo', () => {
    expect(isFlower({ id: 0, suit: 'bamboo', rank: 1 })).toBe(false)
  })
})

describe('tilesEqual', () => {
  it('matches same suit and rank regardless of id', () => {
    const a: Tile = { id: 1, suit: 'bamboo', rank: 3 }
    const b: Tile = { id: 99, suit: 'bamboo', rank: 3 }
    expect(tilesEqual(a, b)).toBe(true)
  })
  it('rejects different rank', () => {
    const a: Tile = { id: 1, suit: 'bamboo', rank: 3 }
    const b: Tile = { id: 2, suit: 'bamboo', rank: 4 }
    expect(tilesEqual(a, b)).toBe(false)
  })
})

describe('tileLabel', () => {
  it('labels bamboo 3 as B3', () => {
    expect(tileLabel({ id: 0, suit: 'bamboo', rank: 3 })).toBe('B3')
  })
  it('labels East wind', () => {
    expect(tileLabel({ id: 0, suit: 'wind', rank: 1 })).toBe('East')
  })
})
