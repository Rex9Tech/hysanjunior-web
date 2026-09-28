// src/modules/admin/products/types.ts

import { PRODUCT_INTERVAL } from "./constants";
import type { TSortOrder } from "../../../hooks/useSort";

export type AdminProductInterval =
  (typeof PRODUCT_INTERVAL)[keyof typeof PRODUCT_INTERVAL];

export interface IAdminProduct {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: string;
  unit_amount: number;
  currency: string;
  interval: AdminProductInterval | null;
  period_label: string;
  recurring: boolean;
  free: boolean;
  active: boolean;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  google_play_product_id?: string | null;
  app_store_product_id?: string | null;
  in_app?: boolean;
  supported_providers?: string[];
  thumbnail_url?: string | null;
  thumbnail_asset_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
  discarded_at?: Date | null;
  undiscarded_at?: Date | null;
}

export interface IAdminProductFormValues {
  code?: string;
  name: string;
  description: string;
  unit_amount: number;
  currency: string;
  interval?: AdminProductInterval;
  active: boolean;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  google_play_product_id?: string | null;
  app_store_product_id?: string | null;
  thumbnail_asset_id?: string | null;
}

export interface IAdminProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
}
