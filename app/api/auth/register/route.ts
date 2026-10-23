import { NextResponse, type NextRequest } from 'next/server'
import { RegisterSchema } from '@/schemas/auth'
import { registerOrganizationAndAdmin } from '@/services/auth-service'
import { setSession } from '@/lib/session'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: z.flattenError(parsed.error),
      },
      { status: 400 },
    )
  }

  try {
    const { user } = await registerOrganizationAndAdmin(parsed.data)
    await setSession({
      userId: user.id,
      organizationId: user.organizationId,
      departmentId: user.departmentId,
      role: user.role,
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    const message =
      status === 409 ? 'Could not create account' : 'Could not create account'
    return NextResponse.json({ error: message }, { status })
  }
}
