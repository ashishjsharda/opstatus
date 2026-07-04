import { NextRequest, NextResponse } from 'next/server'
import { getServices, createService } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const services = getServices()
  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json()
  const { name, description, url, group_name, status, order_idx } = body

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const id = createService({
    name,
    description: description || null,
    url: url || null,
    group_name: group_name || 'Core',
    status: status || 'operational',
    order_idx: order_idx || 0,
  })

  return NextResponse.json({ id }, { status: 201 })
}
