import EEGViewer from '@/components/EEGViewer'

export default function EEGViewerPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <EEGViewer />
      </div>
    </main>
  )
}
