import { z } from 'zod'

export const ViewDto = z.object({
  refKey: z.string(),
})

export type ViewDto = z.infer<typeof ViewDto>
