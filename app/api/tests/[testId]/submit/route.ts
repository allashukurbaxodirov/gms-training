import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { testId } = await params
    const body = await req.json()
    const { answers, enrollmentId } = body as {
      answers: Record<string, string | string[]>
      enrollmentId: string | null
    }

    // Testni olish
    const [test] = await sql`
      SELECT id, passing_score FROM tests WHERE id = ${testId}
    `
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

    // Savollarni olish
    const questions = await sql`
      SELECT id, text, type, options, correct_text, points, explanation
      FROM questions WHERE test_id = ${testId}
    `

    // Natijani hisoblash
    let totalPoints = 0
    let earnedPoints = 0
    const detail: { questionId: string; correct: boolean; explanation: string | null }[] = []

    for (const q of questions) {
      const opts: { text: string; is_correct: boolean }[] =
        typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? [])

      const userAns = answers[q.id as string]
      const points = Number(q.points ?? 1)
      totalPoints += points

      let correct = false

      if (q.type === 'single') {
        const idx = typeof userAns === 'string' ? parseInt(userAns) : -1
        if (!isNaN(idx) && idx >= 0 && opts[idx]) {
          correct = opts[idx].is_correct
        }
      } else if (q.type === 'multiple') {
        const selected = (Array.isArray(userAns) ? userAns : []).map(Number)
        const correctIdxs = opts.map((o, i) => o.is_correct ? i : -1).filter(i => i >= 0)
        correct = (
          selected.length === correctIdxs.length &&
          selected.every(i => correctIdxs.includes(i))
        )
      } else if (q.type === 'truefalse') {
        // 'true' javob → birinchi option to'g'ri; 'false' → ikkinchi option to'g'ri
        const uAns = typeof userAns === 'string' ? userAns : ''
        if (opts.length >= 2) {
          // uAns='true' → opts[0] is_correct bo'lishi kerak, 'false' → opts[1]
          if (uAns === 'true') correct = opts[0]?.is_correct === true
          else if (uAns === 'false') correct = opts[1]?.is_correct === true
        } else if (q.correct_text) {
          correct = uAns === String(q.correct_text).toLowerCase()
        }
      } else if (q.type === 'text') {
        // text tipida correct_text bilan taqqoslash (case insensitive)
        if (q.correct_text) {
          correct = (typeof userAns === 'string') &&
            userAns.trim().toLowerCase() === String(q.correct_text).trim().toLowerCase()
        } else {
          // correct_text yo'q bo'lsa — hisoblash qiyin, manual grading kerak
          // Hozircha to'g'ri deb hisoblaymiz agar javob berilsa
          correct = typeof userAns === 'string' && userAns.trim().length > 0
        }
      }

      if (correct) earnedPoints += points

      detail.push({
        questionId: q.id as string,
        correct,
        explanation: q.explanation as string | null ?? null,
      })
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = score >= Number(test.passing_score ?? 70)
    const correctCount = detail.filter(d => d.correct).length

    // test_attempts jadvaliga saqlash
    await sql`
      INSERT INTO test_attempts (
        id, user_id, test_id, enrollment_id,
        answers, score, passed,
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${session.id}::uuid,
        ${testId}::uuid,
        ${enrollmentId ?? null}::uuid,
        ${JSON.stringify(answers)}::jsonb,
        ${score},
        ${passed},
        NOW(), NOW()
      )
    `

    // Agar o'tsa va enrollment bor bo'lsa — progressni 100% qil
    if (passed && enrollmentId) {
      await sql`
        UPDATE enrollments
        SET progress_percent = 100,
            status = 'completed',
            completed_at = NOW(),
            "updatedAt" = NOW()
        WHERE id = ${enrollmentId}::uuid
          AND progress_percent < 100
      `
    }

    return NextResponse.json({
      score,
      passed,
      correct: correctCount,
      total: questions.length,
      detail,
    })
  } catch (e) {
    console.error('Test submit error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
