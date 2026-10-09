import { describe, expect, it } from 'vitest';
import { parseCreateOrderInput } from '../../src/orders/orderInput.js';

describe('parseCreateOrderInput', () => {
  it('accepts a minimal valid FX order request', () => {
    const input = parseCreateOrderInput({
      customerId: 'client-42',
      pair: 'EUR/USD',
      side: 'BUY',
      amount: 1000
    });

    expect(input).toEqual({
      customerId: 'client-42',
      pair: 'EUR/USD',
      side: 'BUY',
      amount: 1000,
      forceFailProcessing: false
    });
  });

  it('rejects invalid order payloads before they reach AWS', () => {
    expect(() =>
      parseCreateOrderInput({
        customerId: '',
        pair: 'EURUSD',
        side: 'HOLD',
        amount: -1
      })
    ).toThrow(/invalid order payload/i);
  });
});
