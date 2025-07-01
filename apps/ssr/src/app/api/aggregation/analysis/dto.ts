import { z } from 'zod'

export const AnalysisDto = z.object({
  refKey: z.string(),
})

export type AnalysisDto = z.infer<typeof AnalysisDto>

export interface AnalysisResponse {
  data: {
    view: number
    reactions: Record<string, number>
  }
}
