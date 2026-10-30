import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/guard'
import { errorResponse } from '@/lib/api-error'
import { ReportExportQuerySchema } from '@/schemas/report'
import { budgetVsActual, summaryReport } from '@/services/report-service'
import { budgetToCsv, summaryToCsv } from '@/services/report-csv'
import { budgetToXlsx, summaryToXlsx } from '@/services/report-xlsx'
import { currentMonth } from '@/lib/format'

const XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// GET /api/reports/export?report=summary|budget[&format=csv|xlsx][&month=YYYY-MM]
// CSV (default) or XLSX downloads for the Phase 4 reports. Managers and admins
// only — staff have no reports page (middleware 403s /reports for them too).
export async function GET(req: NextRequest) {
  const guard = await requireRole('admin', 'manager')
  if (!guard.ok) return guard.response

  const parsed = ReportExportQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  )
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: z.flattenError(parsed.error) },
      { status: 400 },
    )
  }

  const { report, format } = parsed.data
  const month = parsed.data.month ?? currentMonth()

  try {
    if (format === 'xlsx') {
      const body =
        report === 'summary'
          ? await summaryToXlsx(await summaryReport(guard.session, month))
          : await budgetToXlsx(
              await budgetVsActual(guard.session, month),
              month,
            )

      return new NextResponse(new Uint8Array(body), {
        headers: {
          'Content-Type': XLSX_TYPE,
          'Content-Disposition': `attachment; filename="expense-${report}-${month}.xlsx"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const csv =
      report === 'summary'
        ? summaryToCsv(await summaryReport(guard.session, month))
        : budgetToCsv(await budgetVsActual(guard.session, month))

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="expense-${report}-${month}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
