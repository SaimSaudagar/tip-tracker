import { describeTipPool, splitTipPool } from '@/lib/tip-pool';

const team = [
  { name: 'Me', minutes: 390 },
  { name: 'Ana', minutes: 300 },
  { name: 'Bar', minutes: 240 },
];

describe('splitTipPool', () => {
  it('splits by hours worked', () => {
    const shares = splitTipPool(93000, team, 'hours')!;
    expect(shares.map((s) => s.amountCents)).toEqual([39000, 30000, 24000]);
  });

  it('always adds up to the pool, giving leftover cents to the largest remainders', () => {
    const shares = splitTipPool(10000, [
      { name: 'A', minutes: 60 },
      { name: 'B', minutes: 60 },
      { name: 'C', minutes: 60 },
    ], 'hours')!;
    expect(shares.map((s) => s.amountCents)).toEqual([3334, 3333, 3333]);

    const odd = splitTipPool(48713, team, 'hours')!;
    expect(odd.reduce((sum, s) => sum + s.amountCents, 0)).toBe(48713);
  });

  it('splits equally regardless of hours', () => {
    const shares = splitTipPool(1001, team, 'equal')!;
    expect(shares.map((s) => s.amountCents)).toEqual([334, 334, 333]);
  });

  it('gives nothing to someone with no hours in an hours split', () => {
    const shares = splitTipPool(5000, [{ name: 'A', minutes: 300 }, { name: 'B', minutes: 0 }], 'hours')!;
    expect(shares.map((s) => s.amountCents)).toEqual([5000, 0]);
  });

  it('returns null when there is nothing to split by', () => {
    expect(splitTipPool(5000, [], 'equal')).toBeNull();
    expect(splitTipPool(5000, [{ name: 'A', minutes: 0 }], 'hours')).toBeNull();
    expect(splitTipPool(-1, team, 'equal')).toBeNull();
  });
});

describe('describeTipPool', () => {
  it('writes a line per person', () => {
    const shares = splitTipPool(93000, team, 'hours')!;
    expect(describeTipPool(93000, shares, 'hours')).toBe(
      'Tip pool $930.00, split by hours worked:\nMe: $390.00 (6h 30m)\nAna: $300.00 (5h)\nBar: $240.00 (4h)',
    );
    expect(describeTipPool(1001, splitTipPool(1001, team, 'equal')!, 'equal').split('\n')[0]).toBe(
      'Tip pool $10.01, split equally:',
    );
  });
});
