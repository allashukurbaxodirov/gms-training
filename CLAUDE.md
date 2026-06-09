@AGENTS.md

# GMS Training — Loyiha qoidalari (Claude Code uchun)

## Sahifa yaratish standarti

Har yangi himoyalangan sahifa (`app/(protected)/...`) **shu patternda** bo'lishi shart:

```tsx
import { PageLayout } from '@/components/ui/PageLayout'
// loading bo'lsa:
import { PageSkeleton } from '@/components/ui/PageSkeleton'

export default async function MyPage() {
  // ...data fetching...

  return (
    <PageLayout
      title="Sahifa sarlavhasi"
      description="Qisqacha tavsif (ixtiyoriy)"
      action={<button className="...">Yangi yozuv</button>}  // ixtiyoriy
    >
      {/* kontent */}
    </PageLayout>
  )
}
```

**Client pages** uchun loading:
```tsx
if (loading) return <PageSkeleton type="table" />
// yoki: "cards" | "list" | "form" | "detail"
```

## QOIDALAR

### ❌ Qilma
```tsx
<div className="space-y-5">          // ← PageLayout ishlat
<div className="space-y-6">          // ← PageLayout ishlat
<h1 className="text-2xl font-bold">  // ← title= prop ishlat
<div className="min-h-[60vh] ...">   // ← PageSkeleton ishlat
```

### ✅ Qil
```tsx
<PageLayout title="..." description="..." action={...}>
  ...
</PageLayout>

if (loading) return <PageSkeleton type="table" rows={8} />
```

## Dizayn tokenlar

| Token | Qiymat |
|-------|--------|
| Primary navy | `#0B3D91` |
| Gold | `#FFB81C` |
| Fon | `#f0f4f8` |
| Karta | `bg-white rounded-2xl border border-gray-100 shadow-sm` |
| Birlamchi tugma | `bg-[#0B3D91] text-white rounded-xl px-4 py-2 font-semibold` |

## Fayl tuzilmasi

```
app/(protected)/
  [sahifa-nomi]/
    page.tsx          ← Server Component, faqat data fetch
    [SahifaNomi]Client.tsx  ← Client Component (agar kerak bo'lsa)

app/api/
  [resurs]/
    route.ts          ← GET, POST
    [id]/
      route.ts        ← GET, PATCH, DELETE

lib/queries/
  [resurs].ts         ← SQL query funksiyalari
```

## DB qoidalari (muhim!)

- Barcha jadvallar `id uuid NOT NULL` (DEFAULT yo'q) → INSERT da `gen_random_uuid()` yoz
- Barcha jadvallar `"createdAt" timestamptz NOT NULL` va `"updatedAt" timestamptz NOT NULL` (DEFAULT yo'q) → INSERT da `NOW(), NOW()` yoz
- UPDATE da `"updatedAt" = NOW()` qo'sh
