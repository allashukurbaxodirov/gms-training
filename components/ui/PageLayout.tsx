import React from 'react'

interface PageLayoutProps {
  /** Sahifa sarlavhasi */
  title: string
  /** Qisqacha tavsif (ixtiyoriy) */
  description?: string
  /** O'ng tomondagi tugma yoki boshqa element */
  action?: React.ReactNode
  /** Kontentning o'zi */
  children: React.ReactNode
  /** Sarlavha ostida qo'shimcha element (tabs, filters...) */
  toolbar?: React.ReactNode
}

/**
 * Barcha himoyalangan sahifalar uchun standart wrapper.
 *
 * Foydalanish:
 * ```tsx
 * <PageLayout
 *   title="Kurslar"
 *   description="Barcha mavjud kurslar ro'yxati"
 *   action={<button className="btn-primary">Yangi kurs</button>}
 * >
 *   <YourContent />
 * </PageLayout>
 * ```
 */
export function PageLayout({ title, description, action, children, toolbar }: PageLayoutProps) {
  return (
    <div className="space-y-5">
      {/* ─── Sahifa sarlavhasi ─────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {/* ─── Toolbar (tabs, filtrlar...) ──────────── */}
      {toolbar && <div>{toolbar}</div>}

      {/* ─── Asosiy kontent ───────────────────────── */}
      {children}
    </div>
  )
}
