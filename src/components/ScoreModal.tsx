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
