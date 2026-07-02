export function money(v: number): string {
  const abs = Math.abs(v)
  const s = abs.toFixed(2).replace(/\.00$/, '')
  return `$${s}`
}

export function signedMoney(v: number): string {
  if (Math.abs(v) < 0.005) return 'EVEN'
  return `${v > 0 ? '+' : '−'}${money(v)}`
}
