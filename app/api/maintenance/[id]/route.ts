import { NextRequest, NextResponse } from 'next/server'
import { updateMaintenance, deleteMaintenance } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json()
  updateMaintenance(Number(params.id), body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  deleteMaintenance(Number(params.id))
  return NextResponse.json({ ok: true })
}
