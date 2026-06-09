import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
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
      return NextResponse.json({ error: `Bu fayl turi qo'llab-quvvatlanmaydi: ${file.type}` }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._\-Ѐ-ӿ ]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 100)
    const timestamp = Date.now()
    const filename = `${timestamp}_${safeName}`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const url = `/uploads/${filename}`
    return NextResponse.json({ url, filename, size: file.size, ext })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Fayl saqlashda xatolik' }, { status: 500 })
  }
}
