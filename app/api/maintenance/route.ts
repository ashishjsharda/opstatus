import { NextRequest, NextResponse } from 'next/server'
import { getMaintenance, createMaintenance, updateMaintenance, deleteMaintenance } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get('all') === '1'
  return NextResponse.json(getMaintenance(all))
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { title, description, scheduled_at, ends_at, service_ids } = await req.json()
  if (!title || !scheduled_at || !ends_at) {
    return NextResponse.json({ error: 'title, scheduled_at, ends_at required' }, { status: 400 })
  }

  const id = createMaintenance({ title, description, scheduled_at, ends_at, service_ids: service_ids || [] })
  return NextResponse.json({ id }, { status: 201 })
}
