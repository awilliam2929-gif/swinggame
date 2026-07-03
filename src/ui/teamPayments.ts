import type { SwingGameResult } from '../engine/types'

export interface TeamPaymentLine {
  id: string
  fromLabel: string
  toLabel: string
  amount: number
}

/** One settlement line per match: opposing duo ↔ Swing Team. */
export function teamPaymentsFromMatches(
  result: Pick<SwingGameResult, 'swingTeam' | 'matches'>,
  label: (id: string) => string,
): TeamPaymentLine[] {
  const swingLabel = `Swing Team (${result.swingTeam.map(label).join(' & ')})`

  return result.matches
    .filter((match) => Math.abs(match.totalSwing) > 0.005)
    .map((match) => {
      const oppLabel = match.opponents.map(label).join(' & ')
      const amount = Math.round(Math.abs(match.totalSwing) * 100) / 100
      if (match.totalSwing > 0) {
        return {
          id: match.opponents.join('+'),
          fromLabel: oppLabel,
          toLabel: swingLabel,
          amount,
        }
      }
      return {
        id: match.opponents.join('+'),
        fromLabel: swingLabel,
        toLabel: oppLabel,
        amount,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}
