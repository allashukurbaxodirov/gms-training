export const ROUTES = {
  // Public
  LOGIN: '/login',
  VERIFY: '/verify',

  // Employee
  HOME: '/',
  MY_COURSES: '/my-courses',
  COURSE_DETAIL: '/my-courses/:id',
  LESSON_PLAYER: '/my-courses/:id/lessons/:lessonId',
  MY_JITS: '/my-jits',
  BRIEFING: '/briefing',
  CERTIFICATES: '/my-certificates',
  PROFILE: '/profile',
  LEADERBOARD: '/leaderboard',
  LEARNING_PATHS: '/learning-paths',
  LEARNING_PATH: '/learning-paths/:id',
  LIVE_SESSIONS: '/live-sessions',
  SURVEYS: '/surveys',

  // Trainer
  BRIGADE_JITS: '/brigade/jits',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_COURSE_BUILDER: '/admin/courses/:id/builder',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_FLEXIBILITY: '/admin/flexibility-chart',
  ADMIN_MATRIX: '/admin/training-matrix',
  ADMIN_EVALUATIONS: '/admin/evaluations',
  ADMIN_LIVE_SESSIONS: '/admin/live-sessions',
  ADMIN_LEARNING_PATHS: '/admin/learning-paths',
  ADMIN_GAMIFICATION: '/admin/gamification',
  ADMIN_SURVEYS: '/admin/surveys',
  ADMIN_REPORTS: '/admin/reports',
} as const
