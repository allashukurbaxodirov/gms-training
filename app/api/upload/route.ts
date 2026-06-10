import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

const ALLOWED_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['word', 'docx'],
  'application/msword': ['word', 'doc'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['excel', 'xlsx'],
  'application/vnd.ms-excel': ['excel', 'xls'],
  'video/mp4': ['video'],
  'video/webm': ['video'],
  'video/ogg': ['video'],
}

const MAX_SIZE = 100 * 1024 * 1024 // 100 MB

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fayl yuklanmadi' }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fayl hajmi 100 MB dan oshmasligi kerak' }, { status: 400 })
    }

    const mimeAllowed = ALLOWED_TYPES[file.type]
    if (!mimeAllowed) {
      return NextResponse.json({
        error: `Bu fayl turi qo'llab-quvvatlanmaydi: ${file.type}`,
      }, { status: 400 })
    }

    const safeName = file.name
      .replace(/[^a-zA-Z0-9._\- ]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 100)
    const timestamp = Date.now()
    const filename = `uploads/${timestamp}_${safeName}`

    // Vercel Blob storage (production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, file, {
        access: 'public',
        contentType: file.type,
      })
      return NextResponse.json({ url: blob.url, filename: safeName, size: file.size })
    }

    // Local dev only — Vercel filesystem is read-only
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN sozlanmagan. Vercel → Storage → Blob ulanganligini tekshiring.' },
        { status: 503 }
      )
    }

    // Local dev: save to public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, `${timestamp}_${safeName}`), buffer)
    const url = `/uploads/${timestamp}_${safeName}`
    return NextResponse.json({ url, filename: safeName, size: file.size })
  } catch (e: unknown) {
    console.error('Upload error:', e)
    const msg = e instanceof Error ? e.message : 'Fayl saqlashda xatolik'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
