import { z } from 'zod'

export const TradeSchema = z.object({
  symbol: z.string().min(1).max(20),
  type: z.enum(['buy', 'sell']),
  entry_price: z.number().finite().min(0).max(1_000_000),
  exit_price: z.number().finite().min(0).max(1_000_000).nullable(),
  lot_size: z.number().finite().min(0).max(10_000).nullable(),
  pips: z.number().finite().min(-1_000_000).max(1_000_000).nullable(),
  profit_loss: z.number().finite().min(-1_000_000_000).max(1_000_000_000).nullable(),
  entry_time: z.string().datetime({ offset: true }),
  exit_time: z.string().datetime({ offset: true }).nullable(),
  trade_memo: z.string().max(2000).optional(),
})

export const CSVRowSchema = z.object({
  symbol: z.string(),
  type: z.string(),
  entry_price: z.string(),
  exit_price: z.string().optional(),
  lot_size: z.string().optional(),
  pips: z.string().optional(),
  profit_loss: z.string().optional(),
  entry_time: z.string(),
  exit_time: z.string().optional(),
  trade_memo: z.string().optional(),
})

export const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
  token: z.string().optional(), // captcha token
})

export const CheckoutSchema = z.object({ plan: z.literal('basic') })

