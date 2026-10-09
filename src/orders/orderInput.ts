import { z } from 'zod';
import type { CreateOrderInput } from './types.js';

const createOrderSchema = z
  .object({
    customerId: z.string().trim().min(1),
    pair: z.string().regex(/^[A-Z]{3}\/[A-Z]{3}$/),
    side: z.enum(['BUY', 'SELL']),
    amount: z.number().positive(),
    forceFailProcessing: z.boolean().optional().default(false)
  })
  .strict();

export function parseCreateOrderInput(payload: unknown): CreateOrderInput {
  const result = createOrderSchema.safeParse(payload);

  if (!result.success) {
    throw new Error(`Invalid order payload: ${result.error.issues.map((issue) => issue.message).join('; ')}`);
  }

  return result.data;
}
