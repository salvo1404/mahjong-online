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
