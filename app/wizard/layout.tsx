import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'EEG-Klassifikation' }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
