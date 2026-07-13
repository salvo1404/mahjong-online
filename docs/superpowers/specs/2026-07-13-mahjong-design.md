# Taiwanese Mahjong — Browser Game Design

**Date:** 2026-07-13
**Stack:** React + Vite + TypeScript
**Target:** Chrome browser, single player vs 3 AI opponents

---

## Overview

A client-side Taiwanese Mahjong (台灣麻將) game. No backend, no multiplayer — everything runs in the browser. The human plays as South seat against 3 rule-based AI players. Scoring uses the tai (台) system with a minimum of 1 tai to win.

---

## Architecture

```
mahjong/
├── src/
│   ├── game/
│   │   ├── tiles.ts       — tile definitions, wall generation, shuffle
│   │   ├── hand.ts        — hand analysis, shanten number, winning detection
│   │   ├── rules.ts       — chi/pon/kan/win eligibility per Taiwanese rules
│   │   ├── scoring.ts     — tai pattern recognition and calculation
│   │   └── ai.ts          — AI discard and claim decisions
│   ├── state/
│   │   └── gameReducer.ts — all game state via useReducer
│   ├── components/
│   │   ├── Board.tsx       — table layout
│   │   ├── PlayerArea.tsx  — hand + melds + discards per player
│   │   ├── Tile.tsx        — single tile render
│   │   ├── ActionPanel.tsx — chi/pon/kan/win/pass buttons
│   │   └── ScoreModal.tsx  — end-of-round tai breakdown
│   └── App.tsx
```

**Key principle:** the `game/` folder is pure TypeScript with zero React imports. All game logic is testable independently. React state is a thin layer on top.

---

## Data Model

```ts
type Suit = 'bamboo' | 'circles' | 'characters' | 'wind' | 'dragon' | 'flower'
type Tile = { id: number; suit: Suit; rank: number }

// rank for winds: 1=East 2=South 3=West 4=North
// rank for dragons: 1=Chun(中) 2=Hatsu(發) 3=Haku(白)
// rank for flowers: 1-4=flowers, 5-8=seasons

type Meld = { type: 'chi' | 'pon' | 'kan'; tiles: Tile[]; from: PlayerIndex }

type Player = {
  hand: Tile[]
  melds: Meld[]
  discards: Tile[]
  flowers: Tile[]
  score: number      // chips, starting at 1000
}

type GameState = {
  players: [Player, Player, Player, Player]
  wall: Tile[]
  deadWall: Tile[]        // replacement tiles for flowers and kan
  currentTurn: PlayerIndex
  phase: 'drawing' | 'claiming' | 'scoring' | 'gameover'
  lastDiscard: { tile: Tile; from: PlayerIndex } | null
  round: { wind: 'east' | 'south'; dealer: PlayerIndex; roundNum: number }
  pendingClaims: ClaimOption[]
}
```

Human player is always index 0 (South seat).

---

## Tile Set (144 tiles)

| Group | Count |
|---|---|
| Bamboo 1–9 × 4 | 36 |
| Circles 1–9 × 4 | 36 |
| Characters 1–9 × 4 | 36 |
| Winds (E/S/W/N) × 4 | 16 |
| Dragons (中/發/白) × 4 | 12 |
| Flowers + Seasons | 8 |
| **Total** | **144** |

---

## Taiwanese Rules

### Dealing
- Each player receives 16 tiles
- Dealer draws first tile from wall (starts their turn with 17 effectively)
- Flowers/seasons drawn at any time → immediately revealed, replaced from dead wall

### Claiming Priority (highest to lowest)
1. **胡 Win** — any player, from any discard
2. **槓 Kan** — quad, from any player or self-draw
3. **碰 Pon** — triplet, from any player
4. **吃 Chi** — sequence, left player only (上家)

If multiple players can win the same discard, priority is clockwise from discarder.

### Winning Hand
14 tiles = 4 sets (sequences or triplets) + 1 pair.
Special hands: seven pairs (七對), all triplets (碰碰胡).

### Tai Scoring (minimum 1 tai to win)

| Pattern | Chinese | Tai |
|---|---|---|
| Self-draw | 自摸 | +1 |
| Concealed hand | 門前清 | +1 |
| All sequences | 平胡 | +1 |
| All triplets | 碰碰胡 | +4 |
| Seven pairs | 七對 | +4 |
| Flush (one suit) | 清一色 | +4 |
| All honor tiles | 字一色 | +8 |
| Big three dragons | 大三元 | +16 |

### Payment
- Discard win: discarder pays the full amount to winner
- Self-draw: all 3 other players pay equally to winner
- Per-tai value: 100 chips (configurable)

---

## AI Design

**Algorithm:** shanten-number-based tile efficiency

**Discard strategy:**
- Evaluate every tile in hand after drawing
- Discard the tile that minimizes the resulting shanten number
- Tiebreak: isolated honor tiles → terminals → suited tiles

**Claim strategy:**
- Claim if it reduces shanten number
- Always win when able
- Skip claims that worsen hand efficiency

**Turn pacing:**
- Discard: 800–1200ms randomized delay (feels natural)
- Claim decision: 400ms delay

**Difficulty:** single level — competent but not optimal. Good for learning the game.

---

## UI Design

### Layout (top-down table view)

```
┌─────────────────────────────────────┐
│         Player 2 (North/AI)         │
│    [melds]  [back tiles]  [melds]   │
├──────────┬──────────────┬───────────┤
│ Player 3 │   Discard    │ Player 1  │
│  (West)  │    Pool      │  (East)   │
│   [AI]   │  (4 zones)   │   [AI]    │
├──────────┴──────────────┴───────────┤
│         Player 0 (South/You)        │
│  [melds]  [ your tiles — face up ]  │
│     [ Chi | Pon | Kan | Win | Pass ]│
│         Score: 1000 chips           │
└─────────────────────────────────────┘
```

### Visual Style
- Clean & modern flat design
- Dark green felt background
- White tiles with soft shadows
- AI tiles shown as grey backs
- Sans-serif font (Inter)
- Colors adjustable — no hard dependencies on specific palette

### Tile Rendering
- Unicode Mahjong characters for tile faces (U+1F000 range)
- Fallback: styled text labels

### Action Panel
- Appears after an AI discard if human has valid claim options
- Buttons: Chi / Pon / Kan / Win / Pass
- Auto-passes after 15 seconds if no input

### Feedback
- Tile claim animates to meld area
- Winning hand highlights matched sets with color overlay
- Score modal shows tai breakdown (English + Chinese labels)

---

## Game Flow

```
Start → Deal tiles → [Draw phase] → Player draws
  → if flower: reveal + replace, draw again
  → Player discards
  → Claiming window opens (human gets priority check)
  → AI claims or passes
  → Next player's turn
  → [Win] → Tai calculation → Score settlement → Next round
  → [Wall empty] → Draw (流局) → Next round
```

---

## Out of Scope (MVP)

- Online multiplayer
- Multiple difficulty levels
- Sound effects
- Mobile layout
- Save/load game state
- Tournament / ranking system
