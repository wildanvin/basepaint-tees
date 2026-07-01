'use client'

import { useEffect, useState } from 'react'

const basepaintStartedAt = 0x64d3c1d3
const basepaintEpochDuration = 86400

function getRemainingParts(nowMs = Date.now()) {
  const elapsedSeconds = Math.floor(nowMs / 1000 - basepaintStartedAt)
  const remainingSeconds =
    basepaintEpochDuration - (elapsedSeconds % basepaintEpochDuration)
  const hours = Math.floor((remainingSeconds / 3600) % 24)
  const minutes = Math.floor((remainingSeconds / 60) % 60)
  const seconds = Math.floor(remainingSeconds % 60)

  return { hours, minutes, seconds }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function OrderCountdown() {
  const [remaining, setRemaining] = useState(() => getRemainingParts())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(getRemainingParts())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className='border border-[#41c7ff]/50 bg-[#07151c] p-3 shadow-[4px_4px_0_#41c7ff]'>
      <p className='font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#41c7ff]'>
        Chance to buy ends in:
      </p>
      <p className='mt-1 font-mono text-2xl font-black tabular-nums text-white'>
        {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
      </p>
      <p className='mt-1 text-xs leading-5 text-white/55'></p>
    </div>
  )
}
