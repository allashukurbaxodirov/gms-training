'use client'

import { MessageSquare, ExternalLink } from 'lucide-react'

interface Props {
  courseId: string
}

export function FeedbackTab({ courseId: _ }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-7 w-7 text-purple-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">Feedback so&apos;rovnomalari</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Kurs tugatilgandan so&apos;ng xodimlardan fikr-mulohaza yig&apos;ish uchun so&apos;rovnoma bog&apos;lang
        </p>
        <a
          href="/admin/surveys"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#0B3D91' }}
        >
          <ExternalLink className="h-4 w-4" />
          So&apos;rovnomalar sahifasiga o&apos;tish
        </a>
      </div>
    </div>
  )
}
