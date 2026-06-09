import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { FileText, CheckCircle, BookOpen, ShieldCheck } from 'lucide-react'

export default async function BriefingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Initial briefing/induction content - static for now
  const briefingTopics = [
    {
      icon: ShieldCheck,
      title: 'Mehnat xavfsizligi va salomatlik',
      description: 'Ish joyidagi xavfsizlik qoidalari, individual himoya vositalaridan foydalanish, favqulodda vaziyatlarda harakat tartibi.',
      color: '#dc2626',
      steps: [
        'Ish joyini xavfsiz saqlash',
        'Individual himoya vositalarini taqish',
        'Favqulodda chiqish yo\'llarini bilish',
        'Yong\'in xavfsizligi qoidalari',
      ],
    },
    {
      icon: BookOpen,
      title: 'Korporativ qoidalar va me\'yorlar',
      description: 'UzAuto korxonasining ichki tartib-qoidalari, kiyinish kodeksi, ish vaqtiga rioya qilish.',
      color: '#0B3D91',
      steps: [
        'Ish vaqti jadvali va tartib-intizom',
        'Kiyinish kodeksi',
        'Mobil telefon va internetdan foydalanish',
        'Maxfiylik va ma\'lumotlarni himoya qilish',
      ],
    },
    {
      icon: FileText,
      title: 'Ish jarayonlari va texnologiyalar',
      description: 'Asosiy ishlab chiqarish jarayonlari, sifat nazorati tizimlari va hujjatlashtirish talablari.',
      color: '#0f766e',
      steps: [
        'Sifat nazorat tizimlari (GM-GMS)',
        'Hujjatlashtirish va hisobotlar',
        'Ishlab chiqarish jarayonlari',
        'Asbob-uskunalardan foydalanish',
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl text-white p-6" style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1e40af 100%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kirish yo&apos;riqnomasi</h1>
            <p className="text-blue-200 mt-1 text-sm">
              Xush kelibsiz, {session.full_name}! Ushbu yo&apos;riqnoma yangi xodimlarga korxona va ish jarayonlari bilan tanishishga yordam beradi.
            </p>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="grid gap-4">
        {briefingTopics.map((topic, idx) => {
          const Icon = topic.icon
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: topic.color + '15' }}>
                    <Icon className="h-5 w-5" style={{ color: topic.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">{topic.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
                  </div>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: topic.color }}>
                    {idx + 1}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topic.steps.map((step, si) => (
                    <div key={si} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: topic.color + '08' }}>
                      <CheckCircle className="h-4 w-4 shrink-0" style={{ color: topic.color }} />
                      <span className="text-sm text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 text-lg">Yo&apos;riqnoma bilan tanishdingizmi?</h3>
        <p className="text-gray-500 text-sm mt-1 mb-4">
          Ushbu yo&apos;riqnomadagi barcha qoidalar bilan tanishdim va ularga rioya qilishga tayyorman.
        </p>
        <button
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#0B3D91' }}
        >
          <CheckCircle className="h-4 w-4" />
          Tasdiqlash
        </button>
      </div>
    </div>
  )
}
