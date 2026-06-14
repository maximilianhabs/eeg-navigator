import { cookies } from 'next/headers'

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get('eeg-admin-session')
  const secret = process.env.ADMIN_SECRET
  return !!secret && session?.value === secret
}
