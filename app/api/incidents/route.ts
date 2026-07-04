import { NextRequest, NextResponse } from 'next/server'
import { getIncidents, createIncident } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get('all') === '1'
  const incidents = getIncidents(all)
  return NextResponse.json(incidents)
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json()
  const { title, status, impact, body: updateBody, service_ids } = body

  if (!title || !updateBody) {
    return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
  }

  const id = createIncident({
    title,
    status: status || 'investigating',
    impact: impact || 'minor',
    body: updateBody,
    service_ids: service_ids || [],
  })

  return NextResponse.json({ id }, { status: 201 })
}
