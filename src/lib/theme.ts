import { useEffect, useState } from 'react'

// Dark "Mission" theme is the default (less glare in the cabin); "Day" is the light theme for
// projectors and bright rooms. The choice is remembered per device.
export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]

const STORAGE_KEY = 'theme'
/** Matches --head in index.css, so the browser chrome blends with the header. */
const THEME_COLOR: Record<Theme, string> = { dark: '#000000', light: '#ffffff' }

function initialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])
  return [theme, setTheme] as const
}
