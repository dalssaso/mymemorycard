import { useEffect, useState } from 'react'

const SHOW_AT_Y = 240

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SHOW_AT_Y)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <button
      aria-label="Back to the top"
      className="md:hidden fixed bottom-20 right-4 z-40 rounded-full bg-primary-purple text-white shadow-lg hover:bg-primary-cyan transition-colors w-11 h-11 flex items-center justify-center border border-primary-purple/40"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      type="button"
    >
      <span className="material-symbols-outlined text-2xl leading-none">arrow_upward</span>
    </button>
  )
}
