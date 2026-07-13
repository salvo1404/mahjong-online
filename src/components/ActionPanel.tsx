import { useEffect, useRef, useState } from 'react'
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
  const remainingRef = useRef(AUTO_PASS_SECONDS)

  useEffect(() => {
    remainingRef.current = AUTO_PASS_SECONDS
    setRemaining(AUTO_PASS_SECONDS)
    const interval = setInterval(() => {
      remainingRef.current -= 1
      setRemaining(remainingRef.current)
      if (remainingRef.current <= 0) {
        const pass = options.find(o => o.type === 'pass')
        if (pass) onClaim(pass)
        remainingRef.current = AUTO_PASS_SECONDS
        setRemaining(AUTO_PASS_SECONDS)
      }
    }, 1000)
    return () => {
      clearInterval(interval)
      remainingRef.current = AUTO_PASS_SECONDS
    }
  }, [options, onClaim])

  return (
    <div className={styles.panel}>
      {options.filter(o => o.type !== 'pass').map((o) => (
        <button key={o.type} className={`${styles.btn} ${styles[o.type]}`} onClick={() => onClaim(o)}>
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
