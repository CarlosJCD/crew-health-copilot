import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/context'
import { EarthPhoto } from './EarthPhoto'
import { Icon } from './Icon'

/**
 * Earth Window, once she has chosen the card: a "View image" button. The photo of Earth opens in a pop-up, big,
 * only when she asks for it (choosing the card does not load anything).
 */
export function ViewEarth({ title }: { title: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="button wide" onClick={() => setOpen(true)}>
        <Icon name="earth" size={18} /> {t('earth.view')}
      </button>
      {open && <EarthModal title={title} onClose={() => setOpen(false)} />}
    </>
  )
}

/**
 * The pop-up: the photo as large as the screen allows, its date and credit. Escape, the close button or a tap
 * outside closes it; Escape closes only this pop-up when it opens over a panel.
 */
function EarthModal({ title, onClose }: { title: string; onClose: () => void }) {
  const { t } = useI18n()
  const box = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  }, [onClose])
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    box.current?.focus()
    // Capture phase: this pop-up handles Escape before a panel under it does.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      prev?.focus?.()
    }
  }, [])
  return (
    <div className="earth-modal-backdrop" onClick={onClose}>
      <div
        className="earth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="earth-modal-title"
        tabIndex={-1}
        ref={box}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="earth-modal-head">
          <h2 id="earth-modal-title" lang="en">
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('home.close')}>
            <Icon name="close" />
          </button>
        </div>
        <EarthPhoto large />
      </div>
    </div>
  )
}
