import { z } from 'zod'

export const ReactionDto = z.object({
  refKey: z.string(),
  reaction: z.string().min(1).max(20),
})

export type ReactionDto = z.infer<typeof ReactionDto>
