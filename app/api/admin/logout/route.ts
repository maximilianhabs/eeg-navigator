import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5100'))
  response.cookies.delete('eeg-admin-session')
  return response
}
