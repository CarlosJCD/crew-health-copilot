import { useSyncExternalStore } from 'react'
import type { BodyView, FigureKind } from '../orbit/pain'

/** Which body figure she draws on, shared by every figure of the app and kept between visits. */
const KEY = 'orbit.figure'
const listeners = new Set<() => void>()

const read = (): FigureKind => {
  try {
    return localStorage.getItem(KEY) === 'male' ? 'male' : 'female'
  } catch {
    return 'female'
  }
}
let value: FigureKind = read()

export function setFigure(kind: FigureKind) {
  value = kind
  try {
    localStorage.setItem(KEY, kind)
  } catch {
    // Storage off: the choice lasts until reload.
  }
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useFigure(): [FigureKind, (kind: FigureKind) => void] {
  return [useSyncExternalStore(subscribe, () => value, () => 'female' as FigureKind), setFigure]
}

/** Width / height of each figure's drawing (react-muscle-highlighter viewBoxes), so the box hugs the body. */
export const FIGURE_ASPECT: Record<FigureKind, Record<BodyView, number>> = {
  female: { front: 724 / 1448, back: 724 / 1448 },
  male: { front: 734 / 1538, back: 774 / 1448 },
}
