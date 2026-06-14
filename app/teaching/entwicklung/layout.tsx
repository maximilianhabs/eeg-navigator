import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Kindliche EEG-Entwicklung' }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
