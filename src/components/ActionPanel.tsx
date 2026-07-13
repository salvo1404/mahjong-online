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
