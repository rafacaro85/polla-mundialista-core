export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLAYER: 'PLAYER',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
} as const;

export const PACKAGE_TYPES = {
  FAMILIA: 'familia',
  STARTER: 'starter',
  FREE: 'FREE',
  LAUNCH_PROMO: 'launch_promo',
  ENTERPRISE_LAUNCH: 'ENTERPRISE_LAUNCH',
} as const;

export const MATCH_STATUS = {
  NS: 'NS',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  PST: 'PST',
  CANC: 'CANC',
  ABD: 'ABD',
} as const;
