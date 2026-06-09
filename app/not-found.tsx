import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#f0f4f8' }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-6"
        style={{ backgroundColor: '#0B3D91' }}
      >
        UA
      </div>
      <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
      <p className="text-xl font-semibold text-gray-700 mb-1">Sahifa topilmadi</p>
      <p className="text-sm text-gray-400 mb-8">Siz qidirgan sahifa mavjud emas yoki o&apos;chirilgan</p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: '#0B3D91' }}
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
