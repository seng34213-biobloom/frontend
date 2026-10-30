/**
 * Response shapes the storefront reads from the API. Money is always a
 * 2-dp string; dates are ISO strings.
 */

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  size: string;
  price: string;
  unitWeightG?: number;
  /** Name used by the current catalogue API. */
  unitWeightGrams?: number;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  basePrice: string;
  unitWeightG: number;
  seller: { id: string; businessName: string };
  variants: ProductVariant[];
  images?: ProductImage[];
}

export interface ProductPage {
  items: ProductListItem[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ProductDetail extends ProductListItem {
  ingredients?: string | null;
  allergens?: string | null;
  rating?: { average: number | string | null; count: number } | null;
  stockByVariant: Record<string, number>;
  earliestExpiryByVariant: Record<string, string | null>;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer?: { name: string | null } | null;
}

export interface ReviewSummary {
  count: number;
  avgRating?: number | null;
  average?: number | string | null;
}

export interface BundleComponent {
  quantity: number;
  /** Shape returned by GET /api/bundles (BundleComponentView). */
  product?: { id?: string; name: string; slug: string };
  available?: number;
  productName?: string;
  productSlug?: string;
  variantName?: string;
  size?: string;
  variant?: {
    id?: string;
    name?: string;
    size?: string;
    product?: { name: string; slug: string };
  };
}

export interface Bundle {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  totalWeightG: number;
  available?: number;
  stockAvailable?: number;
  items?: BundleComponent[];
  components?: BundleComponent[];
  componentsTotal?: string;
  seller?: { id: string; businessName: string };
}

export interface CartLine {
  id: string;
  quantity: number;
  variant?: {
    id: string;
    sku: string;
    name: string;
    size: string;
    price: string;
    unitWeightG: number;
    productId?: string;
    productSlug: string;
    productName: string;
  } | null;
  bundle?: {
    id: string;
    slug: string;
    name: string;
    price: string;
    totalWeightG?: number;
  } | null;
  available: number;
  lineSubtotal: string;
}

export interface CartView {
  items: CartLine[];
  itemCount: number;
  subtotal: string;
  totalWeightG: number;
}

export interface Quote {
  subtotal: string;
  discount?: string;
  promoCode?: string | null;
  shippingFee: string;
  bracket?: string | null;
  /** Older API builds name the bracket label `shippingBracket`. */
  shippingBracket?: string | null;
  total: string;
  totalWeightG: number;
}

export interface Address {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type Gateway = 'STRIPE' | 'PAYHERE';

export type PaymentCheckout =
  | { method: 'REDIRECT'; url: string }
  | { method: 'FORM_POST'; url: string; fields: Record<string, string> };

export interface CheckoutResult {
  order: {
    id: string;
    orderNumber?: number;
    status: OrderStatus;
    totalAmount: string;
    shippingFee: string;
    totalWeightG: number;
    currency?: string;
  };
  payment: {
    id: string;
    gateway: Gateway;
    status: string;
    checkout: PaymentCheckout;
  };
}

export type OrderStatus =
  'PENDING_PAYMENT' | 'PAID' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';

export interface OrderSummary {
  id: string;
  orderNumber: number;
  placedAt: string;
  status: OrderStatus;
  totalAmount: string;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantName: string;
  size: string;
  quantity: number;
  unitPriceSnapshot: string;
  lineTotal: string;
  bundleName?: string | null;
}

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface RefundRequest {
  id: string;
  orderId: string;
  amount: string;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string | null;
}

export interface OrderDetail {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address | null;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
  totalWeightG?: number;
  placedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason?: string | null;
  delivery: {
    status: string;
    assignedAt: string | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    riderName: string | null;
  } | null;
  refundRequests?: RefundRequest[];
  payments?: Array<{
    status: PaymentStatus;
    amount: string;
    refundedAmount: string;
    gateway?: Gateway;
  }>;
}

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type SubscriptionAction = 'pause' | 'resume' | 'skip-next' | 'cancel';

export interface Subscription {
  id: string;
  productVariantId: string;
  frequencyDays: number;
  discountRate: string;
  quantity: number;
  status: SubscriptionStatus;
  nextBillingDate: string;
  paymentGateway: Gateway;
  cancelledAt: string | null;
  product?: { id: string; name: string; slug: string } | null;
  variant?: { id: string; name: string; size: string; price: string } | null;
  discountedUnitPrice?: string | null;
}

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  resolvedAt: string | null;
  createdAt: string;
}
