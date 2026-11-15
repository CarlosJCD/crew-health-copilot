import { useState } from 'react'
import { BOARDS, closest, groupOf, shuffled, type Group } from '../orbit/constellations'
import { useI18n } from '../i18n/context'

interface Props {
  /** Boards completed on this device (leisure log only; nothing is measured). */
  completed: number
  onComplete: () => void
  /** Deep link for screenshots: `#/play?board=2&solved=1`. */
  initialBoard?: number
  initialSolved?: boolean
  /** In a pop-up the pop-up's title names the game: no second heading. */
  heading?: boolean
}

/** Constellations, free mode: group 16 tiles into 4 sets. No timer, no score. */
export function Play({ completed, onComplete, initialBoard = 0, initialSolved = false, heading = true }: Props) {
  const { t } = useI18n()
  const [boardIndex, setBoardIndex] = useState(Math.min(Math.max(initialBoard, 0), BOARDS.length - 1))
  const board = BOARDS[boardIndex]
  const [solved, setSolved] = useState<Group[]>(initialSolved ? board.groups : [])
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [hints, setHints] = useState(0)

  const remaining = shuffled(board).filter((tile) => !solved.some((g) => g.tiles.includes(tile)))
  const unsolved = board.groups.filter((g) => !solved.includes(g))
  const done = unsolved.length === 0

  const choose = (i: number) => {
    setBoardIndex(i)
    setSolved([])
    setSelected([])
    setMessage('')
    setHints(0)
  }
  const toggle = (tile: string) => {
    setMessage('')
    setSelected((s) => (s.includes(tile) ? s.filter((x) => x !== tile) : s.length < 4 ? [...s, tile] : s))
  }
  const check = () => {
    const g = groupOf(board, selected)
    if (g) {
      const next = [...solved, g]
      setSolved(next)
      setSelected([])
      setMessage('')
      if (next.length === board.groups.length) onComplete()
    } else {
      setMessage(closest(board, selected) === 3 ? t('play.three') : t('play.notYet'))
    }
  }

  return (
    <div className="play">
      <section className="play-head">
        {heading && <h2>{t('play.title')}</h2>}
        <div className="actions" role="group" aria-label={t('play.boards')}>
          {BOARDS.map((b, i) => (
            <button key={b.board} type="button" className="button secondary" aria-pressed={i === boardIndex} onClick={() => choose(i)} lang="en">
              {b.board}
            </button>
          ))}
        </div>
        <p lang="en">{board.intro_en}</p>
        <p className="muted">{t('play.note', { n: completed })}</p>
      </section>

      {solved.map((g) => (
        <article key={g.name_en} className="solved-group" lang="en">
          <h3>{g.name_en}</h3>
          <p className="tiles-line">{g.tiles.join(' · ')}</p>
          <p>{g.fact_en}</p>
          <p className="muted">
            <a href={g.source} target="_blank" rel="noreferrer">
              {t('play.source')}
            </a>
          </p>
        </article>
      ))}

      {done ? (
        <section className="play-done" role="status">
          <p>{t('play.done')}</p>
          {BOARDS.length > 1 && (
            <button type="button" className="button" onClick={() => choose((boardIndex + 1) % BOARDS.length)}>
              {t('play.other')}
            </button>
          )}
        </section>
      ) : (
        <section aria-label={t('play.tiles')}>
          <div className="tile-grid">
            {remaining.map((tile) => (
              <button key={tile} type="button" className="tile" aria-pressed={selected.includes(tile)} onClick={() => toggle(tile)} lang="en">
                {tile}
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="button" disabled={selected.length !== 4} onClick={check}>
              {t('play.check')}
            </button>
            <button type="button" className="button secondary" disabled={!selected.length} onClick={() => setSelected([])}>
              {t('play.clear')}
            </button>
            <button type="button" className="link" disabled={hints >= unsolved.length} onClick={() => setHints((h) => h + 1)}>
              {t('play.hint')}
            </button>
          </div>
          {message && <p role="status">{message}</p>}
          {unsolved.slice(0, hints).map((g) => (
            <p key={g.name_en} className="muted" lang="en">
              {t('play.hintLabel')} {g.hint_en}
            </p>
          ))}
        </section>
      )}
    </div>
  )
}
