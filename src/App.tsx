import { useReducer, useState } from 'react'
import { gameReducer, createInitialState } from './state/gameReducer'
import { getClaimOptions } from './game/rules'
import { calculateTai } from './game/scoring'
import { isWinningHand } from './game/hand'
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

  const canSelfDrawWin =
    state.currentTurn === 0 &&
    state.phase === 'drawing' &&
    state.players[0].hand.length === 14 &&
    isWinningHand(state.players[0].hand)

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
    ? calculateTai(state.players[state.winner].hand, state.players[state.winner].melds, state.isSelfDraw)
    : null

  return (
    <>
      <Board state={state} selectedTile={selectedTile} onTileClick={handleTileClick} />
      {canSelfDrawWin && (
        <div style={{ position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <button
            onClick={() => dispatch({ type: 'DECLARE_WIN', playerIndex: 0, isSelfDraw: true })}
            style={{ padding: '12px 24px', fontSize: '18px', fontWeight: 700, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            自摸 Win!
          </button>
        </div>
      )}
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
