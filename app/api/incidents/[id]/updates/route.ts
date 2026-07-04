import { NextRequest, NextResponse } from 'next/server'
import { addIncidentUpdate } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { status, body } = await req.json()
  if (!status || !body) {
    return NextResponse.json({ error: 'Status and body required' }, { status: 400 })
  }

  addIncidentUpdate(Number(params.id), status, body)
  return NextResponse.json({ ok: true })
}
