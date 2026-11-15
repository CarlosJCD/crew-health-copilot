import { useId, useState, type ReactNode } from 'react'

interface Props {
  /** Name of the button for screen readers ("What is mood?"). */
  label: string
  children: ReactNode
}

/**
 * A small "?" that explains a term. Opens on hover, on keyboard focus and on tap; closes on leaving,
 * on Escape and when focus moves away (a tap elsewhere on touch screens).
 */
export function InfoTip({ label, children }: Props) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className="infotip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="infotip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" id={id} className="infotip-text">
          {children}
        </span>
      )}
    </span>
  )
}
