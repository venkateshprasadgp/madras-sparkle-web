export type UserRole =
  | "SUPER_ADMINISTRATOR"
  | "ADMINISTRATOR"
  | "CONTENT_EDITOR"
  | "REGISTERED_VISITOR";

export type JewelryCategory =
  | "NECKLACE"
  | "HARAM"
  | "BANGLES_BRACELET"
  | "EARRINGS_JUMMIKI"
  | "PENDANT"
  | "RINGS"
  | "NOSE_PINS";

export interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  city_area: string;
  role: UserRole;
  photo_authorization_consent: boolean;
  tryon_count: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku_id: string;
  title: string;
  category: JewelryCategory;
  jewelry_type: string;
  description: string | null;
  indicative_price: number | null;
  show_indicative_price: boolean;
  featured_image_url: string;
  transparent_png_url: string;
  video_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  target_link: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface SystemSettings {
  id: number;
  max_tryon_per_user: number;
  whatsapp_business_number: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: UserRole;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}
