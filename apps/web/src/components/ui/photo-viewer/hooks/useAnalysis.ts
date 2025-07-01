import useSWR from 'swr'

import { injectConfig } from '~/config'
import { client } from '~/lib/client'

export const useAnalysis = (refKey: string) => {
  return useSWR(
    `/api/aggregation/analysis?refKey=${refKey}`,
    () => client.analysis({ refKey }),
    {
      isPaused: () => !injectConfig.useApi,
    },
  )
}
