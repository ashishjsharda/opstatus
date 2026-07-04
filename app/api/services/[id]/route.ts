import { NextRequest, NextResponse } from 'next/server'
import { getService, updateService, deleteService } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const service = getService(Number(params.id))
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(service)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json()
  updateService(Number(params.id), body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  deleteService(Number(params.id))
  return NextResponse.json({ ok: true })
}
