import type { NextRequest } from 'next/server'

import indexHtml from '../index.html'

export const GET = async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    return import('./[...all]/dev').then((m) => m.handler(req))
  }

  return new Response(indexHtml, {
    headers: {
      'Content-Type': 'text/html',
      'X-SSR': '1',
    },
  })
}
