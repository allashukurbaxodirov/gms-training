export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HR: 'hr',
  INSTRUCTOR: 'instructor',
  BRIGADIR_TL: 'brigadir_tl',
  USTA_GL: 'usta_gl',
  SEX_BOSHLIGI: 'sex_boshligi',
  SHIFT_BOSHLIGI: 'shift_boshligi',
  EMPLOYEE: 'employee',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ADMIN_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]

export const TRAINER_ROLES: Role[] = [
  ...ADMIN_ROLES,
  ROLES.INSTRUCTOR,
  ROLES.BRIGADIR_TL,
  ROLES.USTA_GL,
  ROLES.SEX_BOSHLIGI,
]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  hr: 'HR',
  instructor: 'Instruktor',
  brigadir_tl: 'Brigadir TL',
  usta_gl: 'Usta GL',
  sex_boshligi: 'Sex Boshligi',
  shift_boshligi: 'Shift Boshligi',
  employee: 'Xodim',
}
