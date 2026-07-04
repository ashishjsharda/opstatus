import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSetting } from './db'

export interface SessionData {
  isAdmin?: boolean
}

const SESSION_OPTIONS = {
  cookieName: 'opstatus_session',
  password: process.env.SESSION_SECRET || 'fallback-secret-change-me-in-env-32chars',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  return session.isAdmin === true
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = getSetting('admin_password')
  if (!stored) return false
  return bcrypt.compare(password, stored)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
