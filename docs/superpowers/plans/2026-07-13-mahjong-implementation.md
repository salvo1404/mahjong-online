# Taiwanese Mahjong Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-playable Taiwanese Mahjong game (台灣麻將) with 3 AI opponents, tai-based scoring, and clean modern UI.

**Architecture:** React + Vite SPA, no backend. Pure TypeScript game logic in `src/game/` (zero React imports), thin React state layer via `useReducer` in `src/state/gameReducer.ts`, and React components in `src/components/`.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Vitest for tests, CSS Modules for styling.

## Global Constraints

- Human player is always index 0 (South seat)
- 144 tiles total (36 bamboo + 36 circles + 36 characters + 16 winds + 12 dragons + 8 flowers/seasons)
- Minimum 1 tai to win; per-tai value = 100 chips; starting chips = 1000
- AI turn delay: 800–1200ms (discard), 400ms (claim decision)
- Action panel auto-passes after 15 seconds
- No backend, no multiplayer, no sound, no mobile layout

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Interfaces:**
- Produces: running dev server at `localhost:5173`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd /Users/salvatore.balzano/Code/mahjong
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Add vitest config to `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Replace `src/App.tsx` with placeholder**

```tsx
export default function App() {
  return <div style={{ background: '#1a5c38', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Mahjong Loading…</div>
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```
Expected: server running at `http://localhost:5173`, green page with "Mahjong Loading…"

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold React + Vite + TypeScript project"
```

---

### Task 2: Tile Definitions

**Files:**
- Create: `src/game/tiles.ts`
- Create: `src/game/tiles.test.ts`

**Interfaces:**
- Produces:
  - `type Suit = 'bamboo' | 'circles' | 'characters' | 'wind' | 'dragon' | 'flower'`
  - `type Tile = { id: number; suit: Suit; rank: number }`
  - `type PlayerIndex = 0 | 1 | 2 | 3`
  - `function buildWall(): Tile[]` — returns shuffled 144-tile array
  - `function isFlower(tile: Tile): boolean`
  - `function tilesEqual(a: Tile, b: Tile): boolean` — compares suit+rank (not id)
  - `function tileLabel(tile: Tile): string` — e.g. "B3", "C7", "East", "中"

- [ ] **Step 1: Write failing tests**

```ts
// src/game/tiles.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/tiles.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/game/tiles.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/game/tiles.test.ts
```
Expected: PASS all 8 tests

- [ ] **Step 5: Commit**

```bash
git add src/game/tiles.ts src/game/tiles.test.ts
git commit -m "feat: tile definitions, wall builder, and labels"
```

---

### Task 3: Hand Analysis (Shanten Number + Win Detection)

**Files:**
- Create: `src/game/hand.ts`
- Create: `src/game/hand.test.ts`

**Interfaces:**
- Consumes: `Tile`, `tilesEqual` from `./tiles`
- Produces:
  - `function shanten(tiles: Tile[]): number` — returns -1 if complete hand, 0 if tenpai, N if N tiles away
  - `function isWinningHand(tiles: Tile[]): boolean` — 14-tile complete hand check
  - `function isSevenPairs(tiles: Tile[]): boolean`
  - `function findWinningDecompositions(tiles: Tile[]): MeldGroup[][]` — all valid set+pair breakdowns
  - `type MeldGroup = { type: 'seq' | 'tri' | 'pair'; tiles: Tile[] }`

- [ ] **Step 1: Write failing tests**

```ts
// src/game/hand.test.ts
import { describe, it, expect } from 'vitest'
import { shanten, isWinningHand, isSevenPairs } from './hand'
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/hand.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/game/hand.ts`**

```ts
import { type Tile, tilesEqual } from './tiles'

export type MeldGroup = { type: 'seq' | 'tri' | 'pair'; tiles: Tile[] }

function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit)
    return a.rank - b.rank
  })
}

function countGroups(tiles: Tile[]): { sets: number; pairs: number; partial: number } {
  const sorted = sortTiles(tiles)
  const used = new Array(sorted.length).fill(false)
  let sets = 0, pairs = 0, partial = 0

  // greedy: triplets first
  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue
    let count = 1
    const matches = [i]
    for (let j = i + 1; j < sorted.length && count < 3; j++) {
      if (!used[j] && tilesEqual(sorted[j], sorted[i])) { matches.push(j); count++ }
    }
    if (count >= 3) { matches.slice(0, 3).forEach(k => used[k] = true); sets++; continue }
  }
  // sequences
  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue
    const s = sorted[i]
    if (!['bamboo','circles','characters'].includes(s.suit)) continue
    const n1 = sorted.findIndex((t, k) => !used[k] && k > i && t.suit === s.suit && t.rank === s.rank + 1)
    if (n1 === -1) continue
    const n2 = sorted.findIndex((t, k) => !used[k] && k > n1 && t.suit === s.suit && t.rank === s.rank + 2)
    if (n2 === -1) continue
    used[i] = used[n1] = used[n2] = true; sets++
  }
  // pairs
  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue
    for (let j = i + 1; j < sorted.length; j++) {
      if (!used[j] && tilesEqual(sorted[i], sorted[j])) { used[i] = used[j] = true; pairs++; break }
    }
  }
  // partial (pairs used as partial sets)
  partial = pairs
  return { sets, pairs, partial }
}

export function isSevenPairs(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false
  const sorted = sortTiles(tiles)
  for (let i = 0; i < 14; i += 2) {
    if (!tilesEqual(sorted[i], sorted[i + 1])) return false
  }
  return true
}

export function isWinningHand(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false
  if (isSevenPairs(tiles)) return true
  return checkWin(sortTiles(tiles))
}

function checkWin(sorted: Tile[]): boolean {
  if (sorted.length === 0) return false
  if (sorted.length === 2) return tilesEqual(sorted[0], sorted[1])
  if (sorted.length % 3 !== 2) return false

  const tile = sorted[0]

  // try as triplet
  if (sorted.length >= 3 && tilesEqual(sorted[1], tile) && tilesEqual(sorted[2], tile)) {
    if (checkWin(sorted.slice(3))) return true
  }

  // try as sequence start
  if (['bamboo','circles','characters'].includes(tile.suit)) {
    const i1 = sorted.findIndex((t, i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank + 1)
    const i2 = sorted.findIndex((t, i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank + 2)
    if (i1 !== -1 && i2 !== -1) {
      const rest = sorted.filter((_, i) => i !== 0 && i !== i1 && i !== i2)
      if (checkWin(rest)) return true
    }
  }

  return false
}

export function findWinningDecompositions(tiles: Tile[]): MeldGroup[][] {
  if (!isWinningHand(tiles)) return []
  if (isSevenPairs(tiles)) {
    const sorted = sortTiles(tiles)
    const groups: MeldGroup[] = []
    for (let i = 0; i < 14; i += 2) {
      groups.push({ type: 'pair', tiles: [sorted[i], sorted[i+1]] })
    }
    return [groups]
  }
  const results: MeldGroup[][] = []
  function recurse(remaining: Tile[], current: MeldGroup[]) {
    if (remaining.length === 0) { results.push(current); return }
    if (remaining.length === 2 && tilesEqual(remaining[0], remaining[1])) {
      results.push([...current, { type: 'pair', tiles: remaining }])
      return
    }
    const sorted = sortTiles(remaining)
    const tile = sorted[0]
    // triplet
    if (sorted.length >= 3 && tilesEqual(sorted[1], tile) && tilesEqual(sorted[2], tile)) {
      recurse(sorted.slice(3), [...current, { type: 'tri', tiles: sorted.slice(0,3) }])
    }
    // sequence
    if (['bamboo','circles','characters'].includes(tile.suit)) {
      const i1 = sorted.findIndex((t,i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank+1)
      const i2 = sorted.findIndex((t,i) => i > 0 && t.suit === tile.suit && t.rank === tile.rank+2)
      if (i1 !== -1 && i2 !== -1) {
        const rest = sorted.filter((_,i) => i !== 0 && i !== i1 && i !== i2)
        recurse(rest, [...current, { type: 'seq', tiles: [sorted[0], sorted[i1], sorted[i2]] }])
      }
    }
  }
  recurse(sortTiles(tiles), [])
  return results
}

export function shanten(tiles: Tile[]): number {
  if (isWinningHand(tiles)) return -1
  if (tiles.length === 13 && isSevenPairs([...tiles, { id: -1, suit: 'bamboo', rank: -1 }])) return 0

  // seven pairs shanten
  const sorted = sortTiles(tiles)
  let pairs = 0
  for (let i = 0; i + 1 < sorted.length; i++) {
    if (tilesEqual(sorted[i], sorted[i+1])) { pairs++; i++ }
  }
  const sevenPairsShanten = 6 - pairs

  // standard shanten: 8 - 2*sets - max(pairs, 1)
  const { sets, partial } = countGroups(tiles)
  const standardShanten = 8 - 2 * sets - partial

  return Math.min(sevenPairsShanten, standardShanten)
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/game/hand.test.ts
```
Expected: PASS all tests

- [ ] **Step 5: Commit**

```bash
git add src/game/hand.ts src/game/hand.test.ts
git commit -m "feat: hand analysis, shanten number, win detection"
```

---

### Task 4: Rules Engine (Claim Eligibility)

**Files:**
- Create: `src/game/rules.ts`
- Create: `src/game/rules.test.ts`

**Interfaces:**
- Consumes: `Tile`, `tilesEqual` from `./tiles`; `isWinningHand` from `./hand`
- Produces:
  - `type ClaimType = 'win' | 'kan' | 'pon' | 'chi' | 'pass'`
  - `type ClaimOption = { type: ClaimType; tiles: Tile[] }` — tiles involved in the claim
  - `function getClaimOptions(hand: Tile[], melds: Meld[], discard: Tile, playerIndex: PlayerIndex, discarderIndex: PlayerIndex): ClaimOption[]`
  - `type Meld = { type: 'chi' | 'pon' | 'kan'; tiles: Tile[]; from: PlayerIndex }`

- [ ] **Step 1: Write failing tests**

```ts
// src/game/rules.test.ts
import { describe, it, expect } from 'vitest'
import { getClaimOptions } from './rules'
import type { Tile } from './tiles'

function t(suit: 'bamboo' | 'circles' | 'characters', rank: number): Tile {
  return { id: rank, suit, rank }
}

describe('getClaimOptions', () => {
  it('allows pon when hand has 2 matching tiles', () => {
    const hand = [t('bamboo',5), t('bamboo',5), t('circles',1)]
    const discard = t('bamboo',5)
    const opts = getClaimOptions(hand, [], discard, 1, 0)
    expect(opts.some(o => o.type === 'pon')).toBe(true)
  })

  it('allows chi only for left player (discarder is index 3, claimer is 0)', () => {
    const hand = [t('bamboo',4), t('bamboo',5), t('circles',1)]
    const discard = t('bamboo',3)
    // player 0 is left of player 3
    const opts = getClaimOptions(hand, [], discard, 0, 3)
    expect(opts.some(o => o.type === 'chi')).toBe(true)
  })

  it('does not allow chi for non-left player', () => {
    const hand = [t('bamboo',4), t('bamboo',5), t('circles',1)]
    const discard = t('bamboo',3)
    // player 0 is NOT left of player 1
    const opts = getClaimOptions(hand, [], discard, 0, 1)
    expect(opts.some(o => o.type === 'chi')).toBe(false)
  })

  it('always includes pass', () => {
    const hand = [t('circles',1), t('circles',2)]
    const discard = t('bamboo',9)
    const opts = getClaimOptions(hand, [], discard, 1, 0)
    expect(opts.some(o => o.type === 'pass')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/rules.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement `src/game/rules.ts`**

```ts
import { type Tile, type PlayerIndex, tilesEqual } from './tiles'
import { isWinningHand } from './hand'

export type ClaimType = 'win' | 'kan' | 'pon' | 'chi' | 'pass'
export type Meld = { type: 'chi' | 'pon' | 'kan'; tiles: Tile[]; from: PlayerIndex }
export type ClaimOption = { type: ClaimType; tiles: Tile[] }

function isLeftOf(claimer: PlayerIndex, discarder: PlayerIndex): boolean {
  return (discarder + 1) % 4 === claimer
}

export function getClaimOptions(
  hand: Tile[],
  melds: Meld[],
  discard: Tile,
  playerIndex: PlayerIndex,
  discarderIndex: PlayerIndex
): ClaimOption[] {
  const options: ClaimOption[] = [{ type: 'pass', tiles: [] }]

  // Win check
  if (isWinningHand([...hand, discard])) {
    options.push({ type: 'win', tiles: [discard] })
  }

  const matching = hand.filter(t => tilesEqual(t, discard))

  // Kan (4 matching in hand)
  if (matching.length >= 3) {
    options.push({ type: 'kan', tiles: [matching[0], matching[1], matching[2], discard] })
  }

  // Pon (2 matching in hand)
  if (matching.length >= 2) {
    options.push({ type: 'pon', tiles: [matching[0], matching[1], discard] })
  }

  // Chi (sequence, left player only, suited tiles only)
  if (
    isLeftOf(playerIndex, discarderIndex) &&
    ['bamboo', 'circles', 'characters'].includes(discard.suit)
  ) {
    const suit = discard.suit as 'bamboo' | 'circles' | 'characters'
    const r = discard.rank
    const seqCombos = [
      [r - 2, r - 1], [r - 1, r + 1], [r + 1, r + 2],
    ]
    for (const [a, b] of seqCombos) {
      const tA = hand.find(t => t.suit === suit && t.rank === a)
      const tB = hand.find(t => t.suit === suit && t.rank === b && t !== tA)
      if (tA && tB) {
        const seq = [tA, tB, discard].sort((x, y) => x.rank - y.rank)
        options.push({ type: 'chi', tiles: seq })
      }
    }
  }

  return options
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/game/rules.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/rules.ts src/game/rules.test.ts
git commit -m "feat: claim eligibility rules (win/kan/pon/chi)"
```

---

### Task 5: Tai Scoring

**Files:**
- Create: `src/game/scoring.ts`
- Create: `src/game/scoring.test.ts`

**Interfaces:**
- Consumes: `Tile`, `Suit` from `./tiles`; `isWinningHand`, `isSevenPairs`, `findWinningDecompositions`, `MeldGroup` from `./hand`; `Meld` from `./rules`
- Produces:
  - `type TaiResult = { total: number; breakdown: { label: string; labelZh: string; tai: number }[] }`
  - `function calculateTai(hand: Tile[], melds: Meld[], isSelfDraw: boolean): TaiResult`
  - `function calculatePayment(tai: number, isSelfDraw: boolean): { perLoser: number; total: number }`
  - `const TAI_PER_CHIP = 100`

- [ ] **Step 1: Write failing tests**

```ts
// src/game/scoring.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/scoring.test.ts
```

- [ ] **Step 3: Implement `src/game/scoring.ts`**

```ts
import type { Tile, Suit } from './tiles'
import { isSevenPairs, findWinningDecompositions } from './hand'
import type { Meld } from './rules'

export const TAI_PER_CHIP = 100

export type TaiResult = {
  total: number
  breakdown: { label: string; labelZh: string; tai: number }[]
}

export function calculateTai(hand: Tile[], melds: Meld[], isSelfDraw: boolean): TaiResult {
  const breakdown: { label: string; labelZh: string; tai: number }[] = []
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)]

  const add = (label: string, labelZh: string, tai: number) =>
    breakdown.push({ label, labelZh, tai })

  if (isSelfDraw) add('Self-draw', '自摸', 1)
  if (melds.length === 0) add('Concealed hand', '門前清', 1)

  if (isSevenPairs(hand)) {
    add('Seven pairs', '七對', 4)
    const total = breakdown.reduce((s, b) => s + b.tai, 0)
    return { total, breakdown }
  }

  const decomps = findWinningDecompositions([...hand])
  if (decomps.length > 0) {
    const decomp = decomps[0]
    const allTriOrPair = decomp.every(g => g.type === 'tri' || g.type === 'pair')
    const allSeq = decomp.filter(g => g.type !== 'pair').every(g => g.type === 'seq')

    if (allTriOrPair && decomp.filter(g => g.type === 'tri').length === 4) {
      add('All triplets', '碰碰胡', 4)
    } else if (allSeq) {
      add('All sequences', '平胡', 1)
    }
  }

  // Flush: all tiles same suit (excluding melds for simplicity, check combined)
  const nonFlowerSuits = new Set(allTiles.filter(t => t.suit !== 'flower').map(t => t.suit))
  if (nonFlowerSuits.size === 1) {
    const suit = [...nonFlowerSuits][0]
    if (['bamboo','circles','characters'].includes(suit)) {
      add('Flush', '清一色', 4)
    } else {
      add('All honors', '字一色', 8)
    }
  }

  // Big three dragons: triplet of all 3 dragon types in melds+hand
  const dragonCounts = [1,2,3].map(r =>
    allTiles.filter(t => t.suit === 'dragon' && t.rank === r).length
  )
  if (dragonCounts.every(c => c >= 3)) add('Big three dragons', '大三元', 16)

  const total = breakdown.reduce((s, b) => s + b.tai, 0)
  return { total, breakdown }
}

export function calculatePayment(tai: number, isSelfDraw: boolean): { perLoser: number; total: number } {
  const perLoser = tai * TAI_PER_CHIP
  const total = isSelfDraw ? perLoser * 3 : perLoser * 3
  return { perLoser, total }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/game/scoring.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat: tai scoring and chip payment calculation"
```

---

### Task 6: AI Player

**Files:**
- Create: `src/game/ai.ts`
- Create: `src/game/ai.test.ts`

**Interfaces:**
- Consumes: `Tile`, `PlayerIndex` from `./tiles`; `shanten` from `./hand`; `getClaimOptions`, `Meld`, `ClaimOption` from `./rules`
- Produces:
  - `function aiChooseDiscard(hand: Tile[]): Tile` — returns tile to discard
  - `function aiChooseClaim(hand: Tile[], melds: Meld[], discard: Tile, playerIndex: PlayerIndex, discarderIndex: PlayerIndex): ClaimOption` — returns best claim or pass

- [ ] **Step 1: Write failing tests**

```ts
// src/game/ai.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/game/ai.test.ts
```

- [ ] **Step 3: Implement `src/game/ai.ts`**

```ts
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
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/game/ai.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/ai.ts src/game/ai.test.ts
git commit -m "feat: AI discard and claim strategy"
```

---

### Task 7: Game State Reducer

**Files:**
- Create: `src/state/gameReducer.ts`
- Create: `src/state/gameReducer.test.ts`

**Interfaces:**
- Consumes: all `src/game/` exports
- Produces:
  - `type GameState` (full state shape from spec)
  - `type GameAction` (union of all dispatch actions)
  - `function gameReducer(state: GameState, action: GameAction): GameState`
  - `function createInitialState(): GameState`

- [ ] **Step 1: Write failing tests**

```ts
// src/state/gameReducer.test.ts
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
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/state/gameReducer.test.ts
```

- [ ] **Step 3: Implement `src/state/gameReducer.ts`**

```ts
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
}

export type GameAction =
  | { type: 'HUMAN_DISCARD'; tile: Tile }
  | { type: 'AI_DISCARD'; playerIndex: PlayerIndex; tile: Tile }
  | { type: 'HUMAN_CLAIM'; claim: ClaimOption }
  | { type: 'AI_CLAIM'; playerIndex: PlayerIndex; claim: ClaimOption }
  | { type: 'DRAW_TILE'; playerIndex: PlayerIndex }
  | { type: 'NEXT_ROUND' }
  | { type: 'DECLARE_WIN'; playerIndex: PlayerIndex; isSelfDraw: boolean }

function makePlayer(): Player {
  return { hand: [], melds: [], discards: [], flowers: [], score: 1000 }
}

function drawFromDeadWall(wall: Tile[], deadWall: Tile[]): { tile: Tile; deadWall: Tile[] } {
  if (deadWall.length > 0) {
    return { tile: deadWall[deadWall.length - 1], deadWall: deadWall.slice(0, -1) }
  }
  return { tile: wall[wall.length - 1], deadWall: wall.slice(0, -1) }
}

function dealTiles(player: Player, tiles: Tile[], deadWall: Tile[]): { player: Player; deadWall: Tile[] } {
  let p = { ...player, hand: [...tiles] }
  let dw = [...deadWall]
  let flowers: Tile[] = []

  // Replace flowers
  let i = 0
  while (i < p.hand.length) {
    if (isFlower(p.hand[i])) {
      flowers.push(p.hand[i])
      p.hand.splice(i, 1)
      const { tile, deadWall: newDw } = drawFromDeadWall([], dw)
      dw = newDw
      p.hand.push(tile)
      // check the new tile too
    } else {
      i++
    }
  }
  p.flowers = flowers
  return { player: p, deadWall: dw }
}

export function createInitialState(): GameState {
  const fullWall = buildWall()
  const deadWall = fullWall.splice(0, 16)
  let wall = fullWall

  const rawPlayers: [Player, Player, Player, Player] = [
    makePlayer(), makePlayer(), makePlayer(), makePlayer(),
  ]

  // Deal 16 tiles to each player
  const hands: Tile[][] = [[], [], [], []]
  for (let i = 0; i < 16; i++) {
    for (let p = 0; p < 4; p++) {
      hands[p].push(wall.pop()!)
    }
  }

  let players = rawPlayers
  let dw = deadWall
  for (let p = 0; p < 4; p++) {
    const result = dealTiles(rawPlayers[p], hands[p], dw)
    players[p] = result.player
    dw = result.deadWall
  }

  return {
    players,
    wall,
    deadWall: dw,
    currentTurn: 0,
    phase: 'drawing',
    lastDiscard: null,
    round: { wind: 'east', dealer: 0, roundNum: 1 },
    pendingClaims: [],
    winner: null,
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
        phase: playerIndex === 3 ? 'claiming' : 'claiming',
        currentTurn: next,
      }
    }

    case 'DRAW_TILE': {
      const { playerIndex } = action
      if (state.wall.length === 0) return { ...state, phase: 'scoring' }
      const tile = state.wall[state.wall.length - 1]
      const newWall = state.wall.slice(0, -1)
      let players = state.players.map((p, i) => {
        if (i !== playerIndex) return p
        if (isFlower(tile)) {
          return { ...p, flowers: [...p.flowers, tile] }
        }
        return { ...p, hand: [...p.hand, tile] }
      }) as GameState['players']
      return { ...state, players, wall: newWall, phase: 'drawing' }
    }

    case 'HUMAN_CLAIM': {
      if (action.claim.type === 'pass') {
        return { ...state, pendingClaims: [], phase: 'drawing', currentTurn: 0 }
      }
      if (action.claim.type === 'win') {
        return { ...state, phase: 'scoring', winner: 0 }
      }
      const discard = state.lastDiscard!.tile
      const claimTiles = action.claim.tiles.filter(t => t.id !== discard.id)
      const meld: Meld = { type: action.claim.type as 'chi'|'pon'|'kan', tiles: action.claim.tiles, from: state.lastDiscard!.from }
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

    case 'DECLARE_WIN': {
      return { ...state, phase: 'scoring', winner: action.playerIndex }
    }

    case 'NEXT_ROUND': {
      return createInitialState()
    }

    default:
      return state
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/state/gameReducer.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/gameReducer.ts src/state/gameReducer.test.ts
git commit -m "feat: game state reducer and initial deal"
```

---

### Task 8: Tile Component

**Files:**
- Create: `src/components/Tile.tsx`
- Create: `src/components/Tile.module.css`

**Interfaces:**
- Consumes: `Tile` from `../game/tiles`; `tileLabel` from `../game/tiles`
- Produces: `<TileComponent tile={Tile} faceDown={boolean} selected={boolean} onClick={()=>void} />`

- [ ] **Step 1: Create `src/components/Tile.module.css`**

```css
.tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 64px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s, box-shadow 0.1s;
  border: 1px solid rgba(0,0,0,0.1);
  color: #1a1a1a;
  font-family: 'Inter', sans-serif;
}
.tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.3);
}
.tile.selected {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.4);
  background: #e8f4fd;
}
.tile.faceDown {
  background: #2d6a4f;
  color: transparent;
  cursor: default;
}
.tile.faceDown:hover { transform: none; }
.bamboo { color: #2d6a4f; }
.circles { color: #c0392b; }
.characters { color: #2c3e50; }
.wind { color: #7f8c8d; font-size: 9px; }
.dragon { color: #e74c3c; font-size: 16px; }
.flower { color: #8e44ad; font-size: 9px; }
```

- [ ] **Step 2: Create `src/components/Tile.tsx`**

```tsx
import styles from './Tile.module.css'
import { tileLabel, type Tile } from '../game/tiles'

interface Props {
  tile: Tile
  faceDown?: boolean
  selected?: boolean
  onClick?: () => void
}

export default function TileComponent({ tile, faceDown = false, selected = false, onClick }: Props) {
  const suitClass = faceDown ? '' : styles[tile.suit] ?? ''
  return (
    <div
      className={[styles.tile, suitClass, selected ? styles.selected : '', faceDown ? styles.faceDown : ''].join(' ')}
      onClick={onClick}
      title={faceDown ? '' : tileLabel(tile)}
    >
      {faceDown ? '' : tileLabel(tile)}
    </div>
  )
}
```

- [ ] **Step 3: Verify it renders (visual check via dev server)**

```bash
# Add to App.tsx temporarily:
import TileComponent from './components/Tile'
import { buildWall } from './game/tiles'
const wall = buildWall()
// render: <TileComponent tile={wall[0]} /> and <TileComponent tile={wall[0]} faceDown />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Tile.tsx src/components/Tile.module.css
git commit -m "feat: Tile component with face-up/down/selected states"
```

---

### Task 9: Board Layout & Player Areas

**Files:**
- Create: `src/components/Board.tsx`
- Create: `src/components/Board.module.css`
- Create: `src/components/PlayerArea.tsx`
- Create: `src/components/PlayerArea.module.css`

**Interfaces:**
- Consumes: `GameState`, `Player` from `../state/gameReducer`; `TileComponent` from `./Tile`
- Produces:
  - `<Board state={GameState} onDiscard={(tile)=>void} />`
  - `<PlayerArea player={Player} seat={0|1|2|3} isHuman={boolean} selectedTile={Tile|null} onTileClick={(tile)=>void} />`

- [ ] **Step 1: Create `src/components/Board.module.css`**

```css
.board {
  width: 100vw;
  height: 100vh;
  background: #1a5c38;
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    ". north ."
    "west center east"
    ". south .";
  gap: 8px;
  padding: 16px;
  box-sizing: border-box;
}
.north { grid-area: north; }
.south { grid-area: south; }
.east  { grid-area: east; }
.west  { grid-area: west; }
.center {
  grid-area: center;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 8px;
}
.discardZone {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-content: flex-start;
}
```

- [ ] **Step 2: Create `src/components/PlayerArea.module.css`**

```css
.area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.label {
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  font-family: 'Inter', sans-serif;
}
.hand {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  justify-content: center;
}
.melds {
  display: flex;
  gap: 8px;
}
.meldGroup {
  display: flex;
  gap: 2px;
}
.score {
  color: #f0c040;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 3: Create `src/components/PlayerArea.tsx`**

```tsx
import type { Player } from '../state/gameReducer'
import type { Tile } from '../game/tiles'
import TileComponent from './Tile'
import styles from './PlayerArea.module.css'

const SEAT_LABELS = ['South (You)', 'East', 'North', 'West']

interface Props {
  player: Player
  seat: 0 | 1 | 2 | 3
  isHuman: boolean
  selectedTile: Tile | null
  onTileClick: (tile: Tile) => void
}

export default function PlayerArea({ player, seat, isHuman, selectedTile, onTileClick }: Props) {
  return (
    <div className={styles.area}>
      <div className={styles.label}>{SEAT_LABELS[seat]}</div>
      {player.flowers.length > 0 && (
        <div className={styles.hand}>
          {player.flowers.map(t => <TileComponent key={t.id} tile={t} />)}
        </div>
      )}
      <div className={styles.melds}>
        {player.melds.map((meld, i) => (
          <div key={i} className={styles.meldGroup}>
            {meld.tiles.map(t => <TileComponent key={t.id} tile={t} />)}
          </div>
        ))}
      </div>
      <div className={styles.hand}>
        {player.hand.map(t => (
          <TileComponent
            key={t.id}
            tile={t}
            faceDown={!isHuman}
            selected={isHuman && selectedTile?.id === t.id}
            onClick={isHuman ? () => onTileClick(t) : undefined}
          />
        ))}
      </div>
      <div className={styles.score}>{player.score} chips</div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/Board.tsx`**

```tsx
import type { GameState } from '../state/gameReducer'
import type { Tile } from '../game/tiles'
import PlayerArea from './PlayerArea'
import TileComponent from './Tile'
import styles from './Board.module.css'

interface Props {
  state: GameState
  selectedTile: Tile | null
  onTileClick: (tile: Tile) => void
}

export default function Board({ state, selectedTile, onTileClick }: Props) {
  const { players } = state
  return (
    <div className={styles.board}>
      <div className={styles.north}>
        <PlayerArea player={players[2]} seat={2} isHuman={false} selectedTile={null} onTileClick={() => {}} />
      </div>
      <div className={styles.west}>
        <PlayerArea player={players[3]} seat={3} isHuman={false} selectedTile={null} onTileClick={() => {}} />
      </div>
      <div className={styles.center}>
        {([0,1,2,3] as const).map(i => (
          <div key={i} className={styles.discardZone}>
            {players[i].discards.map(t => <TileComponent key={t.id} tile={t} />)}
          </div>
        ))}
      </div>
      <div className={styles.east}>
        <PlayerArea player={players[1]} seat={1} isHuman={false} selectedTile={null} onTileClick={() => {}} />
      </div>
      <div className={styles.south}>
        <PlayerArea player={players[0]} seat={0} isHuman={true} selectedTile={selectedTile} onTileClick={onTileClick} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: Board and PlayerArea layout components"
```

---

### Task 10: Action Panel

**Files:**
- Create: `src/components/ActionPanel.tsx`
- Create: `src/components/ActionPanel.module.css`

**Interfaces:**
- Consumes: `ClaimOption` from `../game/rules`
- Produces: `<ActionPanel options={ClaimOption[]} onClaim={(option: ClaimOption) => void} />`
- Auto-passes after 15 seconds via internal timer

- [ ] **Step 1: Create `src/components/ActionPanel.module.css`**

```css
.panel {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 10px;
  background: rgba(0,0,0,0.4);
  border-radius: 10px;
  margin-top: 8px;
}
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.win  { background: #e74c3c; color: white; }
.kan  { background: #e67e22; color: white; }
.pon  { background: #f0c040; color: #1a1a1a; }
.chi  { background: #3498db; color: white; }
.pass { background: rgba(255,255,255,0.15); color: white; }
.timer { color: rgba(255,255,255,0.5); font-size: 12px; align-self: center; font-family: 'Inter', sans-serif; }
```

- [ ] **Step 2: Create `src/components/ActionPanel.tsx`**

```tsx
import { useEffect, useState } from 'react'
import type { ClaimOption } from '../game/rules'
import styles from './ActionPanel.module.css'

const LABEL: Record<string, string> = { win: 'Win 胡', kan: 'Kan 槓', pon: 'Pon 碰', chi: 'Chi 吃', pass: 'Pass' }
const AUTO_PASS_SECONDS = 15

interface Props {
  options: ClaimOption[]
  onClaim: (option: ClaimOption) => void
}

export default function ActionPanel({ options, onClaim }: Props) {
  const [remaining, setRemaining] = useState(AUTO_PASS_SECONDS)

  useEffect(() => {
    setRemaining(AUTO_PASS_SECONDS)
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          const pass = options.find(o => o.type === 'pass')!
          onClaim(pass)
          return AUTO_PASS_SECONDS
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [options])

  return (
    <div className={styles.panel}>
      {options.filter(o => o.type !== 'pass').map((o, i) => (
        <button key={i} className={`${styles.btn} ${styles[o.type]}`} onClick={() => onClaim(o)}>
          {LABEL[o.type]}
        </button>
      ))}
      <button className={`${styles.btn} ${styles.pass}`} onClick={() => onClaim(options.find(o => o.type === 'pass')!)}>
        {LABEL.pass}
      </button>
      <span className={styles.timer}>{remaining}s</span>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ActionPanel.tsx src/components/ActionPanel.module.css
git commit -m "feat: ActionPanel with claim buttons and auto-pass timer"
```

---

### Task 11: Score Modal

**Files:**
- Create: `src/components/ScoreModal.tsx`
- Create: `src/components/ScoreModal.module.css`

**Interfaces:**
- Consumes: `TaiResult` from `../game/scoring`; `Player` from `../state/gameReducer`
- Produces: `<ScoreModal winner={number} taiResult={TaiResult} players={Player[]} onNextRound={()=>void} />`

- [ ] **Step 1: Create `src/components/ScoreModal.module.css`**

```css
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  min-width: 340px;
  max-width: 480px;
  font-family: 'Inter', sans-serif;
}
.title { font-size: 24px; font-weight: 800; margin-bottom: 16px; text-align: center; }
.row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.label { color: #555; }
.labelZh { color: #999; font-size: 12px; margin-left: 6px; }
.tai { font-weight: 700; color: #e74c3c; }
.total { font-size: 20px; font-weight: 800; text-align: center; margin-top: 16px; }
.scores { margin-top: 16px; }
.scoreRow { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
.btn {
  display: block; width: 100%; margin-top: 20px; padding: 14px;
  background: #2d6a4f; color: white; border: none; border-radius: 10px;
  font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 2: Create `src/components/ScoreModal.tsx`**

```tsx
import type { TaiResult } from '../game/scoring'
import type { Player } from '../state/gameReducer'
import styles from './ScoreModal.module.css'

const SEAT = ['South (You)', 'East', 'North', 'West']

interface Props {
  winnerIndex: number
  taiResult: TaiResult
  players: Player[]
  isDraw?: boolean
  onNextRound: () => void
}

export default function ScoreModal({ winnerIndex, taiResult, players, isDraw, onNextRound }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.title}>
          {isDraw ? '流局 Draw' : `${SEAT[winnerIndex]} Wins!`}
        </div>
        {!isDraw && (
          <>
            {taiResult.breakdown.map((b, i) => (
              <div key={i} className={styles.row}>
                <span className={styles.label}>
                  {b.label}<span className={styles.labelZh}>{b.labelZh}</span>
                </span>
                <span className={styles.tai}>+{b.tai} 台</span>
              </div>
            ))}
            <div className={styles.total}>{taiResult.total} 台 × 100 = {taiResult.total * 100} chips</div>
          </>
        )}
        <div className={styles.scores}>
          {players.map((p, i) => (
            <div key={i} className={styles.scoreRow}>
              <span>{SEAT[i]}</span>
              <span>{p.score} chips</span>
            </div>
          ))}
        </div>
        <button className={styles.btn} onClick={onNextRound}>Next Round →</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ScoreModal.tsx src/components/ScoreModal.module.css
git commit -m "feat: ScoreModal with tai breakdown and chip totals"
```

---

### Task 12: Game Loop & App Wiring

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.module.css`
- Create: `src/hooks/useGameLoop.ts`

**Interfaces:**
- Consumes: all components; `gameReducer`, `createInitialState`, `GameState` from `./state/gameReducer`; `aiChooseDiscard`, `aiChooseClaim` from `./game/ai`; `getClaimOptions` from `./game/rules`; `calculateTai`, `calculatePayment` from `./game/scoring`
- Produces: fully playable game

- [ ] **Step 1: Create `src/hooks/useGameLoop.ts`**

```ts
import { useEffect } from 'react'
import type { GameState, GameAction } from '../state/gameReducer'
import { aiChooseDiscard, aiChooseClaim } from '../game/ai'
import { getClaimOptions } from '../game/rules'
import type { PlayerIndex } from '../game/tiles'

function randomDelay(min: number, max: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)))
}

export function useGameLoop(state: GameState, dispatch: (a: GameAction) => void) {
  useEffect(() => {
    if (state.phase === 'gameover') return

    // AI draw + discard
    if (state.phase === 'drawing' && state.currentTurn !== 0) {
      const pi = state.currentTurn as PlayerIndex
      const player = state.players[pi]

      // Draw tile
      dispatch({ type: 'DRAW_TILE', playerIndex: pi })

      // Then discard after delay
      const timer = setTimeout(async () => {
        await randomDelay(800, 1200)
        const hand = [...player.hand, state.wall[state.wall.length - 1]].filter(Boolean)
        const discard = aiChooseDiscard(hand)
        dispatch({ type: 'AI_DISCARD', playerIndex: pi, tile: discard })
      }, 100)
      return () => clearTimeout(timer)
    }

    // After AI discard: check if human (player 0) can claim
    if (state.phase === 'claiming' && state.lastDiscard && state.lastDiscard.from !== 0) {
      const discard = state.lastDiscard.tile
      const from = state.lastDiscard.from
      const humanHand = state.players[0].hand
      const humanMelds = state.players[0].melds
      const humanOptions = getClaimOptions(humanHand, humanMelds, discard, 0, from)
      const hasNonPass = humanOptions.some(o => o.type !== 'pass')

      if (!hasNonPass) {
        // Human can't do anything: let AI players claim
        const timer = setTimeout(async () => {
          await randomDelay(400, 400)
          // Check each AI player clockwise
          let claimed = false
          for (let offset = 1; offset <= 3; offset++) {
            const pi = ((from + offset) % 4) as PlayerIndex
            if (pi === 0) continue
            const p = state.players[pi]
            const claim = aiChooseClaim(p.hand, p.melds, discard, pi, from)
            if (claim.type === 'win') {
              dispatch({ type: 'DECLARE_WIN', playerIndex: pi, isSelfDraw: false })
              claimed = true
              break
            }
            if (claim.type !== 'pass') {
              dispatch({ type: 'AI_CLAIM', playerIndex: pi, claim })
              claimed = true
              break
            }
          }
          if (!claimed) {
            // No one claims: next player draws
            const next = ((from + 1) % 4) as PlayerIndex
            dispatch({ type: 'DRAW_TILE', playerIndex: next })
          }
        }, 400)
        return () => clearTimeout(timer)
      }
    }
  }, [state.phase, state.currentTurn, state.lastDiscard])
}
```

- [ ] **Step 2: Rewrite `src/App.tsx`**

```tsx
import { useReducer, useState } from 'react'
import { gameReducer, createInitialState } from './state/gameReducer'
import { getClaimOptions } from './game/rules'
import { calculateTai, calculatePayment } from './game/scoring'
import { useGameLoop } from './hooks/useGameLoop'
import Board from './components/Board'
import ActionPanel from './components/ActionPanel'
import ScoreModal from './components/ScoreModal'
import type { Tile } from './game/tiles'
import type { ClaimOption } from './game/rules'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)

  useGameLoop(state, dispatch)

  const isHumanTurn = state.currentTurn === 0 && state.phase === 'drawing'

  // Compute human claim options when it's claiming phase after AI discard
  const humanClaimOptions = (() => {
    if (state.phase !== 'claiming' || !state.lastDiscard || state.lastDiscard.from === 0) return []
    return getClaimOptions(
      state.players[0].hand,
      state.players[0].melds,
      state.lastDiscard.tile,
      0,
      state.lastDiscard.from
    )
  })()

  const showActionPanel = humanClaimOptions.some(o => o.type !== 'pass')

  function handleTileClick(tile: Tile) {
    if (!isHumanTurn) return
    if (selectedTile?.id === tile.id) {
      // Discard the selected tile
      dispatch({ type: 'HUMAN_DISCARD', tile })
      setSelectedTile(null)
    } else {
      setSelectedTile(tile)
    }
  }

  function handleClaim(option: ClaimOption) {
    dispatch({ type: 'HUMAN_CLAIM', claim: option })
  }

  const showScoreModal = state.phase === 'scoring'
  const taiResult = showScoreModal && state.winner !== null
    ? calculateTai(state.players[state.winner].hand, state.players[state.winner].melds, false)
    : null

  return (
    <>
      <Board state={state} selectedTile={selectedTile} onTileClick={handleTileClick} />
      {showActionPanel && (
        <div style={{ position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <ActionPanel options={humanClaimOptions} onClaim={handleClaim} />
        </div>
      )}
      {showScoreModal && taiResult && state.winner !== null && (
        <ScoreModal
          winnerIndex={state.winner}
          taiResult={taiResult}
          players={[...state.players]}
          onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
        />
      )}
      {showScoreModal && state.winner === null && (
        <ScoreModal
          winnerIndex={0}
          taiResult={{ total: 0, breakdown: [] }}
          players={[...state.players]}
          isDraw
          onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Add Inter font to `index.html`**

```html
<!-- Add inside <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 5: Start dev server and play-test**

```bash
npm run dev
```
Open `http://localhost:5173`. Verify:
- Green board renders with 4 player areas
- Your tiles (South) are face-up, others face-down
- Clicking a tile selects it (lifts up), clicking again discards it
- AI players take turns with visible delays
- Action panel appears when you can claim an AI discard
- Score modal appears on win or draw

- [ ] **Step 6: Final commit**

```bash
git add src/
git commit -m "feat: game loop, App wiring — playable Taiwanese Mahjong"
```
