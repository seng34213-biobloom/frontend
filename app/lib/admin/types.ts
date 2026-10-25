/**
 * Response shapes consumed by the console. Money fields arrive as decimal
 * strings. Optional fields cover columns added by the spec-completion
 * migration so older API builds still render.
 */

export interface CustomerRef {
  id: string;
  email: string;
  name: string;
}

export interface AddressRef {
  line1: string;
  line2?: string | null;
  city: string;
  district: string;
  postalCode: string;
}

export interface Rider {
  id: string;
  email: string;
  name: string;
  phone: string;
  active: boolean;
  createdAt?: string;
}

export type DeliveryStatus = 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  attempts?: number;
  assignedAt: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  notes?: string | null;
  proofPhotoUrl?: string | null;
  deliveryUser?: { id: string; name: string; phone: string } | null;
  order?: { id: string; status: string; orderNumber?: number } | null;
}

export interface QueueOrderItem {
  id: string;
  quantity: number;
  variant?: { sku: string; name: string; size: string } | null;
  bundle?: { name: string } | null;
}

export interface QueueOrder {
  id: string;
  orderNumber?: number;
  status: string;
  placedAt: string;
  shippedAt?: string | null;
  totalAmount: string;
  customer?: CustomerRef | null;
  shippingAddress?: AddressRef | null;
  items?: QueueOrderItem[];
}

export interface Variant {
  id: string;
  sku: string;
  name: string;
  size: string;
  price: string;
  unitWeightG: number;
  active: boolean;
  stock?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  basePrice: string;
  unitWeightG: number;
  ingredients?: string | null;
  allergens?: string | null;
  active: boolean;
  seller?: { id: string; businessName: string } | null;
  variants: Variant[];
  images?: ProductImage[];
}

export interface SellerRow {
  id: string;
  email: string;
  businessName: string;
  contactName: string;
  phone: string;
  taxId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string | null;
  createdAt: string;
  approvedAt?: string | null;
}
