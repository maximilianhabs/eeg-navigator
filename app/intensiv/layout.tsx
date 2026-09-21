import { notFound } from 'next/navigation'

// Intensiv und NCSE bleiben bis zur fachlichen Freigabe deaktiviert.
export default function Layout({ children }: { children: React.ReactNode }) {
  void children
  notFound()
}
