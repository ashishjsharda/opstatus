import { NextRequest, NextResponse } from 'next/server'
import { getSession, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const valid = await verifyPassword(password)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const session = await getSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  session.destroy()
  return NextResponse.json({ ok: true })
}
