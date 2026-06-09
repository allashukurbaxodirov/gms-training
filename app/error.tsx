'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#f0f4f8' }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-6"
        style={{ backgroundColor: '#0B3D91' }}
      >
        UA
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Xatolik yuz berdi</h1>
      <p className="text-sm text-gray-400 mb-8">Server bilan aloqada muammo. IT bo&apos;limiga murojaat qiling.</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: '#0B3D91' }}
      >
        Qayta urinish
      </button>
    </div>
  )
}
