// Shared API contracts — populated incrementally as modules land.
//
// Phase 1+: re-export the Prisma-generated enums so the API, web apps and
// tests all import a single source of truth (mapped 1:1 to the database
// schema). The legacy const-object exports below remain for places that
// want a plain TS object form (e.g. JSX where you can't use an enum value).

export {
  Role,
  AdminRole,
  OrderStatus,
  PaymentStatus,
  SubscriptionStatus,
  BatchStatus,
  SellerStatus,
  DeliveryAssignmentStatus,
  PaymentGateway,
  DiscountType,
  PayoutStatus,
  RefundStatus,
  SupportTicketStatus,
  AuditActorType,
} from '@biobloom/prisma';

/** RBAC roles (SDS §7.2 + SRS FR011 multi-seller extension) — string form. */
export const Roles = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  FULFILMENT_STAFF: 'FULFILMENT_STAFF',
  SELLER: 'SELLER',
  DELIVERY: 'DELIVERY',
} as const;
