// School theming: one primary colour per school; the rest of the brand set is derived from it.
export type SchoolTheme = { h: number; c: number; l: number }
export const defaultTheme: SchoolTheme = { h: 255, c: 0.14, l: 0.42 }

// OKLCH -> relative luminance, used to pick white or ink text on the brand colour.
function luminance({ h, c, l }: SchoolTheme) {
  const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3, m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3, s_ = (l - 0.0894841775 * a - 1.2914855480 * b) ** 3
  const rgb = [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_]
  const [r, g, bl] = rgb.map(v => Math.min(1, Math.max(0, v)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
const INK_LUMINANCE = 0.0087

export function onBrandColour(theme: SchoolTheme) {
  const y = luminance(theme)
  return contrast(1, y) >= contrast(y, INK_LUMINANCE) ? '#fff' : '#121821'
}

export function applySchoolTheme(theme: SchoolTheme | null | undefined) {
  const { h, c, l } = theme ?? defaultTheme
  const root = document.documentElement.style, f = (n: number) => n.toFixed(2)
  const set = (name: string, value: string) => root.setProperty(name, value)
  set('--brand', `oklch(${f(l)} ${c} ${h})`)
  set('--brand-hover', `oklch(${f(l - 0.06)} ${c} ${h})`)
  set('--brand-ink', `oklch(${f(l - 0.08)} ${c} ${h})`)
  set('--brand-tint', `oklch(0.93 0.035 ${h})`)
  set('--brand-soft', `oklch(0.965 0.02 ${h})`)
  set('--brand-border', `oklch(0.80 0.07 ${h})`)
  set('--brand-on-muted', `oklch(0.88 0.04 ${h})`)
  set('--on-brand', onBrandColour({ h, c, l }))
}
