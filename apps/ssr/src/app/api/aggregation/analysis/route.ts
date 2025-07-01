import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { guardDbEnabled } from '~/lib/api-guard'
import { DbManager } from '~/lib/db'
import * as schemas from '~/schemas'

import type { AnalysisResponse } from './dto'
import { AnalysisDto } from './dto'

export const GET = guardDbEnabled(
  async (req: NextRequest): Promise<NextResponse<AnalysisResponse>> => {
    const db = DbManager.shared.getDb()
    const searchParams = req.nextUrl.searchParams.entries()

    const { refKey } = AnalysisDto.parse(Object.fromEntries(searchParams))

    const [views] = await db
      .select()
      .from(schemas.views)
      .where(eq(schemas.views.refKey, refKey))
    const reactions = await db
      .select()
      .from(schemas.reactions)
      .where(eq(schemas.reactions.refKey, refKey))

    return NextResponse.json({
      data: {
        view: views.views,
        reactions: reactions.reduce(
          (acc, reaction) => {
            acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
      },
    })
  },
)
