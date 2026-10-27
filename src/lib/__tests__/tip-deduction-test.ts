import { estimateTipDeduction } from '@/lib/tip-deduction';

describe('estimateTipDeduction', () => {
  it('counts the year’s tips kept, up to the $25,000 limit', () => {
    expect(estimateTipDeduction(2026, 1_850_000)).toEqual({
      qualifiedTipsCents: 1_850_000,
      deductionCents: 1_850_000,
      overLimit: false,
    });
    expect(estimateTipDeduction(2026, 2_500_000)).toEqual({
      qualifiedTipsCents: 2_500_000,
      deductionCents: 2_500_000,
      overLimit: false,
    });
    expect(estimateTipDeduction(2026, 3_100_050)).toEqual({
      qualifiedTipsCents: 3_100_050,
      deductionCents: 2_500_000,
      overLimit: true,
    });
  });

  it('exists only for tax years 2025 through 2028', () => {
    expect(estimateTipDeduction(2024, 1_000_000)).toBeNull();
    expect(estimateTipDeduction(2025, 1_000_000)?.deductionCents).toBe(1_000_000);
    expect(estimateTipDeduction(2028, 1_000_000)?.deductionCents).toBe(1_000_000);
    expect(estimateTipDeduction(2029, 1_000_000)).toBeNull();
  });

  it('never goes below zero when tip-outs were more than the tips', () => {
    expect(estimateTipDeduction(2026, -5_000)).toEqual({ qualifiedTipsCents: 0, deductionCents: 0, overLimit: false });
  });
});
