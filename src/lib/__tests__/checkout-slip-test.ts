import { parseCheckoutSlip } from '@/lib/checkout-slip';

describe('parseCheckoutSlip', () => {
  it('reads labels and amounts on the same line', () => {
    expect(
      parseCheckoutSlip([
        'SERVER CHECKOUT',
        'Ana M.  10/24/2026',
        'Net Sales $1,105.00',
        'Non-Cash Tips $148.25',
        'Cash Tips: $64.00',
        'Tip Out (22.00)',
        'Auto Gratuity 35.00',
        'Guests 23',
        'Avg/Guest $48.04',
      ]),
    ).toEqual({ sales: 110500, cardTips: 14825, cashTips: 6400, tipOut: 2200, serviceCharge: 3500, covers: 23 });
  });

  it('reads amounts recognized on the line after their label', () => {
    expect(
      parseCheckoutSlip(['Net Sales', '1,105.00', 'Credit Card Tips', '148.25', 'Declared Tips', '64.00', 'Covers', '23']),
    ).toEqual({ sales: 110500, cardTips: 14825, cashTips: 6400, covers: 23 });
  });

  it('pairs a column of labels with a column of amounts (Android text blocks)', () => {
    expect(
      parseCheckoutSlip([
        'Server Checkout\nAna M.',
        'Net Sales\nCharge Tips\nDeclared Cash Tips\nTip Share\nCover Count',
        '1,105.00\n148.25\n64.00\n22.00\n23',
      ]),
    ).toEqual({ sales: 110500, cardTips: 14825, cashTips: 6400, tipOut: 2200, covers: 23 });
  });

  it('pairs columns recognized as separate lines, below any header lines (iOS)', () => {
    expect(
      parseCheckoutSlip(['SERVER CHECKOUT', 'Net Sales', 'Credit Card Tips', 'Cash Tips', '1,105.00', '148.25', '64.00']),
    ).toEqual({ sales: 110500, cardTips: 14825, cashTips: 6400 });
  });

  it('prefers net sales over gross or total sales', () => {
    expect(parseCheckoutSlip(['Gross Sales $1,240.00', 'Net Sales $1,105.00'])).toEqual({ sales: 110500 });
    expect(parseCheckoutSlip(['Total Sales 980.00'])).toEqual({ sales: 98000 });
  });

  it('ignores tax, averages, percentages and tips received', () => {
    expect(
      parseCheckoutSlip([
        'Sales Tax $88.40',
        'Avg Per Guest 48.04',
        'Tip % 18.2',
        'Tip Share Received $15.00',
        'Guests: 4.5',
      ]),
    ).toEqual({});
  });

  it('does not read a count as dollars, or dollars as a count', () => {
    expect(parseCheckoutSlip(['Cash Tips 64', 'Guests $23.00'])).toEqual({});
    expect(parseCheckoutSlip(['Cash Tips $64'])).toEqual({ cashTips: 6400 });
  });

  it('finds nothing on something that isn’t a checkout slip', () => {
    expect(parseCheckoutSlip(['Grocery list', 'eggs', 'milk 3.49'])).toEqual({});
    expect(parseCheckoutSlip([])).toEqual({});
  });
});
