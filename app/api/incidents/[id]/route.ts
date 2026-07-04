import { NextRequest, NextResponse } from 'next/server'
import { getIncident, deleteIncident } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const incident = getIncident(Number(params.id))
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(incident)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  deleteIncident(Number(params.id))
  return NextResponse.json({ ok: true })
}
