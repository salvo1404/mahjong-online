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
