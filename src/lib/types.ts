export type ProductType = "PHYSICAL" | "DIGITAL" | "SERVICE" | "RENTAL";

export type ProductStatus =
  | "DRAFT"
  | "PENDING"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export type StoreStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type Role = "SUPERADMIN" | "ADMIN" | "USER" | "BUSINESS" | "VENDOR";

export type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  phone_number?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  status?: string;
  // Read-only demo accounts. The server refuses every write for these, so the
  // UI only uses this to say so up front rather than to enforce anything.
  is_demo?: boolean;
  accessToken: string;
  refreshToken: string;
};

export type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  banner?: string | null;
  tagline?: string | null;
  rating?: string | number;
  total_reviews?: number;
  total_products?: number;
  city?: string | null;
  country?: string | null;
  status?: StoreStatus;
};

export type Store = StoreSummary & {
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  commission_rate?: string | number;
  total_sales?: string | number;
  is_active?: boolean;
  rejection_reason?: string | null;
  published_products?: string | number;
  all_products?: string | number;
  createdAt?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    phone_number?: string | null;
  };
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
};

export type Category = CategorySummary & {
  parent_id?: string | null;
  description?: string | null;
  product_type?: ProductType | null;
  sort_order?: number;
  is_active?: boolean;
  product_count?: string | number;
  children?: Category[];
};

export type ProductVariant = {
  id: string;
  name: string;
  sku?: string | null;
  price: string | number;
  compare_at_price?: string | number | null;
  stock: number;
  attributes?: Record<string, unknown>;
  image?: string | null;
  is_active: boolean;
};

export type ProductSummary = {
  id: string;
  title: string;
  slug: string;
  type: ProductType;
  thumbnail?: string | null;
  short_description?: string | null;
  base_price: string | number;
  compare_at_price?: string | number | null;
  currency: string;
  rating?: string | number;
  total_reviews?: number;
  total_sold?: number;
  stock?: number;
  status?: ProductStatus;
  createdAt?: string;
  store?: StoreSummary;
  category?: CategorySummary | null;
};

export type Product = ProductSummary & {
  description?: string | null;
  tags?: string[];
  sku?: string | null;
  has_variants?: boolean;
  is_active?: boolean;
  rejection_reason?: string | null;
  images?: { id: string; url: string; alt?: string | null }[];
  variants?: ProductVariant[];
  digital?: {
    file_name?: string | null;
    version?: string | null;
    download_limit?: number;
    access_expiry_days?: number | null;
  } | null;
  service?: {
    duration_minutes: number;
    mode: "ONSITE" | "REMOTE" | "HYBRID";
    location?: string | null;
    requires_booking: boolean;
  } | null;
  rental?: {
    rental_unit: "HOUR" | "DAY" | "WEEK" | "MONTH";
    price_per_unit: string | number;
    min_units: number;
    max_units?: number | null;
    security_deposit: string | number;
    available_quantity: number;
  } | null;
};

export type CartItem = {
  id: string;
  product_id: string;
  variant_id?: string | null;
  store_id: string;
  type: ProductType;
  quantity: number;
  unit_price: string | number;
  line_total: string | number;
  rental_start?: string | null;
  rental_end?: string | null;
  rental_units?: number | null;
  booking_start?: string | null;
  product: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    stock?: number;
    currency: string;
  };
  variant?: { id: string; name: string; sku?: string | null } | null;
  store: StoreSummary;
};

export type Cart = {
  id: string;
  currency: string;
  stores: { store: StoreSummary; items: CartItem[]; subtotal: number }[];
  summary: {
    total_items: number;
    total_quantity: number;
    total_stores: number;
    subtotal: number;
  };
};

export type Address = {
  id: string;
  label?: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
  type: "SHIPPING" | "BILLING";
  is_default: boolean;
};

export type OrderItem = {
  id: string;
  product_id?: string | null;
  type: ProductType;
  title: string;
  variant_name?: string | null;
  thumbnail?: string | null;
  sku?: string | null;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
  rental_start?: string | null;
  rental_end?: string | null;
  rental_units?: number | null;
  security_deposit?: string | number;
  booking_start?: string | null;
};

export type SubOrder = {
  id: string;
  sub_order_number: string;
  status: OrderStatus;
  subtotal: string | number;
  shipping_total: string | number;
  discount_total?: string | number;
  commission_rate: string | number;
  commission_amount: string | number;
  vendor_earning: string | number;
  grand_total: string | number;
  vendor_note?: string | null;
  cancellation_reason?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  store: StoreSummary;
  items: OrderItem[];
};

export type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: string | number;
  shipping_total: string | number;
  tax_total: string | number;
  discount_total?: string | number;
  coupon_code?: string | null;
  grand_total: string | number;
  currency: string;
  shipping_address?: Address | null;
  customer_note?: string | null;
  placed_at?: string;
  createdAt?: string;
  sub_orders: SubOrder[];
  payment?: {
    id: string;
    provider: string;
    status: PaymentStatus;
    amount: string | number;
    method?: string | null;
    paid_at?: string | null;
  } | null;
};

export type OrderListItem = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: string | number;
  grand_total: string | number;
  currency: string;
  placed_at?: string;
  createdAt?: string;
  total_items: string | number;
  total_stores: string | number;
  preview_items: { title: string; thumbnail?: string | null }[];
};

export type VendorOrderListItem = {
  id: string;
  sub_order_number: string;
  status: OrderStatus;
  subtotal: string | number;
  commission_amount: string | number;
  vendor_earning: string | number;
  grand_total: string | number;
  createdAt?: string;
  total_items: string | number;
  order: {
    id: string;
    order_number: string;
    payment_status: PaymentStatus;
    placed_at?: string;
  };
  customer: { id: string; name: string; email: string; avatar?: string | null };
};

// ─── Phase 2 ─────────────────────────────────────────────────────────────────

export type WalletTxnType = "CREDIT" | "DEBIT";

export type WalletTxnSource =
  | "ORDER_EARNING"
  | "WITHDRAWAL"
  | "WITHDRAWAL_REVERSAL"
  | "ORDER_REFUND"
  | "ADMIN_ADJUSTMENT";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export type WithdrawalMethod =
  | "BANK_TRANSFER"
  | "PAYPAL"
  | "STRIPE"
  | "MOBILE_BANKING";

export type Wallet = {
  id: string;
  balance: string | number;
  currency: string;
  total_earned: string | number;
  total_withdrawn: string | number;
  pending_withdrawal: number;
  upcoming_earning: number;
  available_balance: number;
  min_withdrawal: number;
};

export type WalletTransaction = {
  id: string;
  type: WalletTxnType;
  source: WalletTxnSource;
  amount: string | number;
  balance_after: string | number;
  currency: string;
  reference_type?: string | null;
  reference_id?: string | null;
  description?: string | null;
  createdAt: string;
};

export type Withdrawal = {
  id: string;
  amount: string | number;
  currency: string;
  status: WithdrawalStatus;
  method: WithdrawalMethod;
  account_details: Record<string, unknown>;
  admin_note?: string | null;
  processed_at?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar?: string | null };
  store_name?: string | null;
};

export type DiscountType = "PERCENTAGE" | "FIXED";

export type Coupon = {
  id: string;
  store_id?: string | null;
  code: string;
  name: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: string | number;
  max_discount_amount?: string | number | null;
  min_order_amount: string | number;
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  used_count: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  createdAt: string;
  store?: { id: string; name: string; slug: string } | null;
};

export type CouponPreview = {
  code: string;
  name: string;
  discount_type: DiscountType;
  discount_value: string | number;
  scope: "PLATFORM" | "STORE";
  cart_subtotal: number;
  eligible_subtotal: number;
  discount_amount: number;
  payable: number;
};

export type ReviewStatus = "PENDING" | "PUBLISHED" | "REJECTED";

export type Review = {
  id: string;
  product_id: string;
  store_id: string;
  order_item_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  images?: string[];
  is_verified_purchase: boolean;
  status: ReviewStatus;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  rejection_reason?: string | null;
  createdAt: string;
  reviewer?: { id: string; name: string; email?: string; avatar?: string | null };
  product?: { id: string; title: string; slug: string; thumbnail?: string | null };
  store?: { id: string; name: string; slug: string };
};

export type ReviewSummary = {
  total: number;
  average: number;
  breakdown: Record<string, number>;
};

export type ReviewableItem = {
  order_item_id: string;
  product_id: string;
  product_slug?: string | null;
  title: string;
  thumbnail?: string | null;
  variant_name?: string | null;
  order_number: string;
  completed_at?: string | null;
  delivered_at?: string | null;
  store: { id: string; name: string; slug: string };
};

export type InventoryItem = {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  sku?: string | null;
  type: ProductType;
  stock: number;
  low_stock_threshold: number;
  has_variants: boolean;
  status: ProductStatus;
  total_sold: number;
  is_low_stock: boolean;
  variants: {
    id: string;
    name: string;
    sku?: string | null;
    stock: number;
    is_active: boolean;
  }[];
};

export type InventorySummary = {
  total_products: number;
  low_stock: number;
  out_of_stock: number;
  total_units: number;
};

export type InventoryMovementType =
  | "SALE"
  | "ORDER_CANCELLED"
  | "RESTOCK"
  | "ADJUSTMENT"
  | "RETURN"
  | "INITIAL";

export type InventoryMovement = {
  id: string;
  type: InventoryMovementType;
  quantity_change: number;
  quantity_after: number;
  reference_type?: string | null;
  reference_id?: string | null;
  note?: string | null;
  createdAt: string;
  product: { id: string; title: string; thumbnail?: string | null };
  variant?: { id: string; name: string } | null;
};

export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_PAID"
  | "ORDER_STATUS"
  | "ORDER_CANCELLED"
  | "STORE_STATUS"
  | "PRODUCT_STATUS"
  | "REVIEW_RECEIVED"
  | "REVIEW_REPLY"
  | "WALLET_CREDIT"
  | "WITHDRAWAL_STATUS"
  | "LOW_STOCK"
  | "SYSTEM";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  createdAt: string;
};

// ─── Phase 3 ─────────────────────────────────────────────────────────────────

export type StorePermission =
  | "PRODUCTS"
  | "INVENTORY"
  | "ORDERS"
  | "BOOKINGS"
  | "COUPONS"
  | "REVIEWS"
  | "CHAT"
  | "ANALYTICS"
  | "WALLET";

export type StaffRole = "MANAGER" | "STAFF";
export type StaffStatus = "INVITED" | "ACTIVE" | "REVOKED";

export type StoreAccess = {
  store: { id: string; name: string; slug: string; status: StoreStatus };
  is_owner: boolean;
  role: "OWNER" | StaffRole;
  permissions: StorePermission[];
  available_permissions: StorePermission[];
};

export type StaffMember = {
  id: string;
  role: StaffRole;
  permissions: StorePermission[];
  status: StaffStatus;
  accepted_at?: string | null;
  revoked_at?: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar?: string | null };
};

export type StaffInvite = {
  id: string;
  role: StaffRole;
  permissions: StorePermission[];
  status: StaffStatus;
  createdAt: string;
  store: { id: string; name: string; slug: string; logo?: string | null };
};

export type RentalBookingStatus =
  | "RESERVED"
  | "ACTIVE"
  | "RETURNED"
  | "OVERDUE"
  | "CANCELLED";

export type DepositStatus =
  | "NONE"
  | "HELD"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "FORFEITED";

export type RentalBooking = {
  id: string;
  rental_start: string;
  rental_end: string;
  rental_units: number;
  quantity: number;
  status: RentalBookingStatus;
  security_deposit: string | number;
  deposit_status: DepositStatus;
  damage_fee: string | number;
  deposit_refunded_amount: string | number;
  picked_up_at?: string | null;
  returned_at?: string | null;
  condition_note?: string | null;
  vendor_note?: string | null;
  item_title: string;
  unit_price: string | number;
  order: { id: string; order_number: string; payment_status: PaymentStatus };
  product?: { id: string; title: string; slug: string; thumbnail?: string | null } | null;
  store: { id: string; name: string; slug: string };
  customer: { id: string; name: string; email: string; phone_number?: string | null };
};

export type RentalAvailability = {
  product_id: string;
  title: string;
  rental_unit: "HOUR" | "DAY" | "WEEK" | "MONTH";
  min_units: number;
  max_units?: number | null;
  price_per_unit: string | number;
  security_deposit: string | number;
  total_quantity: number;
  booked: number;
  available: number;
  is_available: boolean;
};

export type ServiceBookingStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ServiceBooking = {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  status: ServiceBookingStatus;
  customer_note?: string | null;
  vendor_note?: string | null;
  cancellation_reason?: string | null;
  reschedule_count: number;
  completed_at?: string | null;
  item_title: string;
  order: { id: string; order_number: string; payment_status: PaymentStatus };
  product?: { id: string; title: string; slug: string; thumbnail?: string | null } | null;
  store: { id: string; name: string; slug: string };
  customer: { id: string; name: string; email: string; phone_number?: string | null };
};

export type ServiceSlot = { start: string; end: string; available: boolean };

export type ServiceSlots = {
  product_id: string;
  title: string;
  date: string;
  duration_minutes: number;
  buffer_minutes: number;
  mode: "ONSITE" | "REMOTE" | "HYBRID";
  requires_booking: boolean;
  daily_cap_reached: boolean;
  has_opening_hours: boolean;
  is_open_today: boolean;
  slots: ServiceSlot[];
};

export type AvailabilityWindow = {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
};

export type TimeOff = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason?: string | null;
  product?: { id: string; title: string } | null;
};

export type ConversationSummary = {
  id: string;
  subject?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  unread_count: number;
  createdAt: string;
  store?: { id: string; name: string; slug: string; logo?: string | null };
  buyer?: { id: string; name: string; email: string; avatar?: string | null };
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "BUYER" | "STORE";
  body: string;
  attachments: string[];
  is_read: boolean;
  createdAt: string;
  sender_name?: string;
  sender_avatar?: string | null;
};

export type ConversationDetail = {
  id: string;
  subject?: string | null;
  order_id?: string | null;
  store: { id: string; name: string };
  buyer: { id: string; name: string };
  my_side: "BUYER" | "STORE";
};

// What POST /chat/conversations echoes back: the raw conversation row, created
// or reused, with its store attached. This is not a ConversationSummary — the
// raw row carries buyer_unread_count/store_unread_count rather than the
// unread_count the inbox query aliases.
export type StartedConversation = {
  id: string;
  store_id: string;
  order_id: string | null;
  subject: string | null;
  store: { id: string; name: string; slug: string };
};

export type AnalyticsRange = { from: string; to: string };

export type VendorAnalyticsOverview = {
  range: AnalyticsRange;
  totals: {
    orders: number;
    gross: number;
    discounts: number;
    commission: number;
    earnings: number;
    customers: number;
    units: number;
    average_order_value: number;
  };
  change: { orders: number; earnings: number };
  order_status: Record<string, number>;
  catalogue: {
    total_products: number;
    published: number;
    low_stock: number;
    average_rating: number;
  };
};

export type AdminAnalyticsOverview = {
  range: AnalyticsRange;
  totals: {
    orders: number;
    gmv: number;
    discounts: number;
    buyers: number;
    commission: number;
    vendor_earnings: number;
    selling_stores: number;
    average_order_value: number;
  };
  platform: {
    stores_total: number;
    stores_active: number;
    stores_pending: number;
    products_published: number;
    products_pending: number;
    users_total: number;
    reviews_published: number;
    withdrawals_pending: number;
  };
};

export type RevenuePoint = {
  date: string;
  orders: number;
  gross?: number;
  earnings?: number;
  gmv?: number;
  commission?: number;
};

export type SalesByType = {
  type: ProductType;
  line_items: number;
  units: number;
  revenue: number;
};

export type TopProduct = {
  product_id: string;
  title: string;
  type: ProductType;
  thumbnail?: string | null;
  slug?: string | null;
  units: number;
  revenue: number;
  orders: number;
};

export type TopStore = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  rating: string | number;
  orders: number;
  gross: number;
  commission: number;
};
