import { NextRequest, NextResponse } from 'next/server'
import { getSubscribers, addSubscriber, confirmSubscriber, deleteSubscriber } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied
  return NextResponse.json(getSubscribers())
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const result = addSubscriber(email)
  if (!result) {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
  }

  // In production: send confirmation email here using nodemailer
  // For now just auto-confirm
  confirmSubscriber(result.token)

  return NextResponse.json({ ok: true, message: 'Subscribed successfully!' }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  deleteSubscriber(token)
  return NextResponse.json({ ok: true })
}
