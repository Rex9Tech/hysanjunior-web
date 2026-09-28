export const ADMIN_PURCHASE_SORT_KEYS = {
  CREATED_AT: "created_at",
  PAID_AT: "paid_at",
  UNIT_AMOUNT: "unit_amount",
  STATUS: "status",
  CURRENCY: "currency",
} as const;

export const ADMIN_SUBSCRIPTION_SORT_KEYS = {
  CREATED_AT: "created_at",
  STARTED_AT: "started_at",
  CURRENT_PERIOD_END: "current_period_end",
  UNIT_AMOUNT: "unit_amount",
  STATUS: "status",
  INTERVAL: "interval",
} as const;

export const ADMIN_COUPON_SORT_KEYS = {
  CREATED_AT: "created_at",
  CODE: "code",
  TITLE: "title",
  AMOUNT: "amount",
  USED_COUNT: "used_count",
  EXPIRES_AT: "expires_at",
} as const;

export const ADMIN_USER_COUPON_SORT_KEYS = {
  CREATED_AT: "created_at",
  DISCOUNT_AMOUNT: "discount_amount",
  FINAL_AMOUNT: "final_amount",
  PAYMENT_TYPE: "payment_type",
  USER_EMAIL: "user_email",
  PRODUCT_NAME: "product_name",
  COUPON_CODE: "coupon_code",
} as const;

export const ADMIN_PURCHASE_TABLE_KEYS = {
  PURCHASE: "purchase",
  USER: "user",
  AMOUNT: "amount",
  STATUS: "status",
  METHOD: "method",
  CREATED: "created",
  ACTIONS: "actions",
} as const;

export const ADMIN_PURCHASE_COLUMNS = ADMIN_PURCHASE_TABLE_KEYS;

export const ADMIN_SUBSCRIPTION_TABLE_KEYS = {
  SUBSCRIPTION: "subscription",
  USER: "user",
  AMOUNT: "amount",
  STATUS: "status",
  PERIOD: "period",
  CANCELING: "canceling",
  ACTIONS: "actions",
} as const;

export const ADMIN_SUBSCRIPTION_COLUMNS = ADMIN_SUBSCRIPTION_TABLE_KEYS;

export const ADMIN_COUPON_COLUMNS = {
  CODE: "code",
  TITLE: "title",
  AMOUNT: "amount",
  USED_COUNT: "used_count",
  EXPIRES_AT: "expires_at",
  CREATED_AT: "created_at",
  ACTIONS: "actions",
} as const;

export const ADMIN_COUPON_TABLE_KEYS = ADMIN_COUPON_COLUMNS;

export const ADMIN_USER_COUPON_TABLE_KEYS = {
  COUPON_CODE: "coupon_code",
  USER_EMAIL: "user_email",
  PRODUCT_NAME: "product_name",
  PAYMENT_TYPE: "payment_type",
  DISCOUNT: "discount",
  FINAL_AMOUNT: "final_amount",
  CREATED_AT: "created_at",
  ACTIONS: "actions",
} as const;

export const ADMIN_USER_COUPON_COLUMNS = ADMIN_USER_COUPON_TABLE_KEYS;

export const ADMIN_COUPON_FILTERS = {
  PAGE: "page",
  COUPON_TYPE: "coupon_type",
  SEARCH: "search",
  VIEW: "view",
} as const;

export {
  COUPON_TYPES,
  COUPON_SYNC_STATUS,
  COUPON_METADATA_KEYS,
  type TCouponType,
  type TCouponSyncStatus,
} from "../../payment/constants";

