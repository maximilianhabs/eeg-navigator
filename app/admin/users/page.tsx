import type { Metadata } from 'next'
import { getUsers } from '@/lib/auth'
import UserManagementClient from './UserManagementClient'

export const metadata: Metadata = { title: 'Benutzerverwaltung' }

export default async function AdminUsersPage() {
  const users = getUsers().map(({ passwordHash: _, ...u }) => u)
  return <UserManagementClient initialUsers={users} />
}
