import type { Role } from '../db/schemas/users'

export const rolePermissions = {
  watchmaker: { watch: ['listAll', 'markRepaired'] },
  customer: { watch: ['readOwn'] },
} as const

type PermissionsMap = typeof rolePermissions

export type Resource = keyof PermissionsMap[Role]

export type Action<TRole extends Role = Role> =
  PermissionsMap[TRole][keyof PermissionsMap[TRole]] extends readonly (infer T)[]
    ? T
    : never
