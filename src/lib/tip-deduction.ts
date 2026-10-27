/**
 * The federal deduction for qualified tips ("no tax on tips"), tax years 2025 through 2028,
 * claimed on Schedule 1-A. Tipbook can only estimate it: it knows the tips logged, not whether
 * they were reported, the person's income, filing status or occupation, so screens show the
 * rules next to the number. The rules, from the IRS:
 * - up to $25,000 of qualified tips per return, whatever the filing status;
 * - reduced by $100 for each $1,000 of modified AGI over $150,000 ($300,000 married filing jointly);
 * - voluntary tips paid in cash or by card, including through a tip pool, in an occupation on
 *   the IRS list of tipped occupations; service charges and auto-gratuities don't count;
 * - the tips must be reported (W-2, 1099 or Form 4137), and married couples must file jointly.
 */

export const TIP_DEDUCTION_FIRST_YEAR = 2025;
export const TIP_DEDUCTION_LAST_YEAR = 2028;
export const TIP_DEDUCTION_LIMIT_CENTS = 2_500_000;

export type TipDeductionEstimate = {
  /** Tips kept after tip-outs, without service charges. */
  qualifiedTipsCents: number;
  /** The same, up to the $25,000 limit, before any reduction for income. */
  deductionCents: number;
  overLimit: boolean;
};

/** The estimate for a tax year's net tips, or null in years without the deduction. */
export function estimateTipDeduction(year: number, netTipsCents: number): TipDeductionEstimate | null {
  if (year < TIP_DEDUCTION_FIRST_YEAR || year > TIP_DEDUCTION_LAST_YEAR) return null;
  const qualifiedTipsCents = Math.max(0, netTipsCents);
  return {
    qualifiedTipsCents,
    deductionCents: Math.min(qualifiedTipsCents, TIP_DEDUCTION_LIMIT_CENTS),
    overLimit: qualifiedTipsCents > TIP_DEDUCTION_LIMIT_CENTS,
  };
}
