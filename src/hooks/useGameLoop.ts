import { useEffect } from 'react'
import type { GameState, GameAction } from '../state/gameReducer'
import { aiChooseDiscard, aiChooseClaim } from '../game/ai'
import { getClaimOptions } from '../game/rules'
import { isWinningHand } from '../game/hand'
import type { PlayerIndex } from '../game/tiles'

function randomDelay(min: number, max: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)))
}

export function useGameLoop(state: GameState, dispatch: (a: GameAction) => void) {
  // Include current player's hand length in deps so the effect re-fires after DRAW_TILE
  const currentPlayerHandLength = state.players[state.currentTurn].hand.length

  useEffect(() => {
    if (state.phase === 'gameover') return

    // Human draw — only if total tile count is still below 14
    if (state.phase === 'drawing' && state.currentTurn === 0) {
      const p0 = state.players[0]
      if (p0.hand.length + p0.melds.length * 3 < 14) {
        dispatch({ type: 'DRAW_TILE', playerIndex: 0 as PlayerIndex })
      }
    }

    // AI draw + self-draw win check + discard (two-phase via dep array)
    if (state.phase === 'drawing' && state.currentTurn !== 0) {
      const pi = state.currentTurn as PlayerIndex
      const player = state.players[pi]

      // Phase 2: hand already has the drawn tile — check using meld-aware lengths
      if (player.hand.length === 14 - player.melds.length * 3 && isWinningHand(player.hand, player.melds.length)) {
        const timer = setTimeout(() => {
          dispatch({ type: 'DECLARE_WIN', playerIndex: pi, isSelfDraw: true })
        }, 400)
        return () => clearTimeout(timer)
      }

      // Phase 1: total tile count below 14 — draw and return; effect re-fires after draw
      const totalTiles = player.hand.length + player.melds.length * 3
      if (totalTiles < 14) {
        dispatch({ type: 'DRAW_TILE', playerIndex: pi })
        return
      }

      // At 14 total tiles (drew but didn't win): discard
      const timer = setTimeout(async () => {
        await randomDelay(800, 1200)
        const discard = aiChooseDiscard(player.hand)
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
            // No one claims: advance turn so the drawing-phase branch draws once
            dispatch({ type: 'ADVANCE_TURN' })
          }
        }, 400)
        return () => clearTimeout(timer)
      }
    }
    // After human discard: let AI players claim
    if (state.phase === 'claiming' && state.lastDiscard && state.lastDiscard.from === 0) {
      const discard = state.lastDiscard.tile
      const timer = setTimeout(async () => {
        let claimed = false
        for (let offset = 1; offset <= 3; offset++) {
          const pi = ((0 + offset) % 4) as PlayerIndex
          const p = state.players[pi]
          const claim = aiChooseClaim(p.hand, p.melds, discard, pi, 0)
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
          dispatch({ type: 'ADVANCE_TURN' })
        }
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [state.phase, state.currentTurn, state.lastDiscard, currentPlayerHandLength])
}
