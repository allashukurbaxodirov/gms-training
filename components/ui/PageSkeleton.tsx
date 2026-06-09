/**
 * Standart loading skeletonlari.
 *
 * Foydalanish:
 * ```tsx
 * if (loading) return <PageSkeleton type="cards" />
 * if (loading) return <PageSkeleton type="table" rows={8} />
 * if (loading) return <PageSkeleton type="form" />
 * if (loading) return <PageSkeleton type="detail" />
 * ```
 */

interface PageSkeletonProps {
  /** Ko'rsatish turi */
  type?: 'cards' | 'table' | 'form' | 'detail' | 'list'
  /** Qator soni (table/list uchun) */
  rows?: number
  /** Karta soni (cards uchun) */
  cols?: number
}

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
    />
  )
}

export function PageSkeleton({ type = 'cards', rows = 6, cols = 3 }: PageSkeletonProps) {
  // ─── Header skeleton (sarlavha + tugma) ────────
  const HeaderSkeleton = () => (
    <div className="flex items-center justify-between mb-1">
      <div className="space-y-1.5">
        <Shimmer className="h-7 w-48" />
        <Shimmer className="h-4 w-72" />
      </div>
      <Shimmer className="h-9 w-28 rounded-xl" />
    </div>
  )

  if (type === 'cards') {
    return (
      <div className="space-y-5">
        <HeaderSkeleton />
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4`}>
          {Array.from({ length: cols * 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Shimmer className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-4 w-3/4" />
                  <Shimmer className="h-3 w-1/2" />
                </div>
              </div>
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-3 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Shimmer className="h-6 w-16 rounded-full" />
                <Shimmer className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-5">
        <HeaderSkeleton />
        {/* Filter bar */}
        <div className="flex gap-3">
          <Shimmer className="h-9 flex-1 max-w-xs rounded-xl" />
          <Shimmer className="h-9 w-32 rounded-xl" />
          <Shimmer className="h-9 w-32 rounded-xl" />
        </div>
        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            {[20, 30, 15, 20, 15].map((w, i) => (
              <Shimmer key={i} className={`h-3.5 w-${w} rounded`} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
              <Shimmer className="h-4 w-6 rounded" />
              <Shimmer className="h-4 flex-1 rounded" />
              <Shimmer className="h-4 w-24 rounded" />
              <Shimmer className="h-4 w-20 rounded" />
              <Shimmer className="h-4 w-16 rounded" />
              <Shimmer className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'form') {
    return (
      <div className="space-y-5 max-w-2xl">
        <HeaderSkeleton />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Shimmer className="h-4 w-28" />
              <Shimmer className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Shimmer className="h-10 w-28 rounded-xl" />
            <Shimmer className="h-10 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'detail') {
    return (
      <div className="space-y-5">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <Shimmer className="h-6 w-64" />
            <Shimmer className="h-4 w-40" />
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {[80, 70, 65, 80].map((w, i) => (
            <Shimmer key={i} className={`h-8 w-${w > 70 ? 20 : 16} rounded-lg`} />
          ))}
        </div>
        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <Shimmer className="h-5 w-48" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-5/6" />
          <Shimmer className="h-4 w-4/5" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // list (default)
  return (
    <div className="space-y-5">
      <HeaderSkeleton />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Shimmer className="h-4 w-2/3" />
              <Shimmer className="h-3 w-1/3" />
            </div>
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
