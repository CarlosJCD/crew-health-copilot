import { useState } from 'react'
import { useI18n } from '../i18n/context'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

/** Her private notes by mission day. They stay on this device: nothing sends them anywhere. */
export type Notes = Record<string, string>

/** Longest note (a few lines about the day, not a document). */
const MAX_NOTE = 2000

interface Props {
  day: number
  notes: Notes
  onChange: (notes: Notes) => void
  onClose: () => void
}

/**
 * "Private note": a pop-up with one note per day. What she writes is saved as she types, on this device only,
 * and her earlier notes are listed under it, newest first.
 */
export function PrivateNoteSheet({ day, notes, onChange, onClose }: Props) {
  const { t } = useI18n()
  const [touched, setTouched] = useState(false)
  const text = notes[day] ?? ''
  const write = (value: string) => {
    setTouched(true)
    const next = { ...notes }
    if (value.trim()) next[day] = value.slice(0, MAX_NOTE)
    else delete next[day]
    onChange(next)
  }
  const earlier = Object.entries(notes)
    .filter(([d, n]) => Number(d) !== day && n.trim())
    .sort((a, b) => Number(b[0]) - Number(a[0]))

  return (
    <Sheet title={t('note.title')} onClose={onClose}>
      <div className="note">
        <p className="note-private">
          <Icon name="lock" size={16} />
          <span>{t('note.private')}</span>
        </p>
        <label htmlFor="note-text" className="note-day">
          {t('note.day', { day })}
        </label>
        <textarea
          id="note-text"
          className="note-text"
          rows={7}
          maxLength={MAX_NOTE}
          value={text}
          placeholder={t('note.placeholder')}
          onChange={(e) => write(e.target.value)}
        />
        <p className="note-status" role="status">
          {touched && text.trim() ? (
            <>
              <Icon name="check" size={14} /> {t('note.saved')}
            </>
          ) : (
            <span className="muted">{t('note.length', { n: text.length, max: MAX_NOTE })}</span>
          )}
        </p>

        <h3 className="note-earlier-title">{t('note.earlier')}</h3>
        {earlier.length === 0 ? (
          <p className="muted note-none">{t('note.none')}</p>
        ) : (
          <ul className="note-list">
            {earlier.map(([d, n]) => (
              <li key={d}>
                <details>
                  <summary>
                    <span className="note-list-day">{t('note.day', { day: d })}</span>
                    <span className="note-list-first">{n.split('\n')[0]}</span>
                  </summary>
                  <p>{n}</p>
                </details>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="button wide note-done" onClick={onClose}>
          {t('note.done')}
        </button>
      </div>
    </Sheet>
  )
}
