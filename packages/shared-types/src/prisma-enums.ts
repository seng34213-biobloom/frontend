// Re-export of Prisma-generated enums. Importers should prefer these over the
// const-objects in `./index.ts` once a service is wired to the Prisma client,
// so the enum values stay in lock-step with the database schema.
//
// The export path is intentionally `@biobloom/prisma` (the workspace alias for
// the prisma package) — its generated/client barrel re-exports every enum.
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
