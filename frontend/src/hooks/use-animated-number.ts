import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberOptions {
  duration?: number
  precision?: number
}

export function useAnimatedNumber(value: number, options: AnimatedNumberOptions = {}): number {
  const { duration = 500, precision = 0 } = options
  const [displayValue, setDisplayValue] = useState(value)
  const previousValueRef = useRef(value)

  useEffect(() => {
    const fromValue = previousValueRef.current

    if (fromValue === value) {
      setDisplayValue(value)
      return
    }

    let frameId: number | null = null
    const startTime = performance.now()
    const precisionFactor = 10 ** precision

    const step = (now: number): void => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const nextValue = fromValue + (value - fromValue) * progress
      setDisplayValue(Math.round(nextValue * precisionFactor) / precisionFactor)

      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }

    frameId = requestAnimationFrame(step)
    previousValueRef.current = value

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [duration, precision, value])

  return displayValue
}
