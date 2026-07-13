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
