-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum (BRD Section 4)
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMINISTRATOR',
    'ADMINISTRATOR',
    'CONTENT_EDITOR',
    'REGISTERED_VISITOR'
);

-- Jewelry Categories Enum (BRD Section 5.ii & 7.6)
CREATE TYPE jewelry_category AS ENUM (
    'NECKLACE',
    'HARAM',
    'BANGLES_BRACELET',
    'EARRINGS_JUMMIKI',
    'PENDANT',
    'RINGS',
    'NOSE_PINS'
);

-- Profiles & User Authorization Table (BRD Section 4: Actors 2 & 3)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    city_area TEXT NOT NULL, -- e.g., Adyar, Besant Nagar, Velachery, OMR, Mylapore
    role user_role DEFAULT 'REGISTERED_VISITOR',
    photo_authorization_consent BOOLEAN DEFAULT FALSE NOT NULL,
    tryon_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Catalog Table with Alphanumeric SKU (BRD Section 4: Actor 5 & Section 7.5)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id TEXT UNIQUE NOT NULL, -- Alphanumeric unique identifier (e.g., MS-NK-916-001)
    title TEXT NOT NULL,
    category jewelry_category NOT NULL,
    jewelry_type TEXT DEFAULT 'Gold 22K BIS 916', -- Natural Diamond, Lab-Grown, Gold, Silver
    description TEXT,
    indicative_price NUMERIC(10, 2),
    show_indicative_price BOOLEAN DEFAULT TRUE,
    featured_image_url TEXT NOT NULL,
    transparent_png_url TEXT NOT NULL, -- Alpha cutout PNG for try-on engine
    video_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website Banners & Promotional Material (BRD Section 7.7 & 7.9)
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual Try-On Activity & Quota Log (BRD Section 4: Actor 3 & 4)
CREATE TABLE tryon_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    sku_id TEXT REFERENCES products(sku_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings & Try-On Quotas (BRD Section 4: Actor 4 & 6)
CREATE TABLE system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    max_tryon_per_user INT DEFAULT 3, -- Configurable quota limit per registered phone number
    whatsapp_business_number TEXT DEFAULT '919876543210',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Trail & Activity Log (BRD Section 6.xix)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id),
    actor_role user_role NOT NULL,
    action TEXT NOT NULL, -- e.g., 'CREATE_PRODUCT', 'UPDATE_PRICE', 'DELETE_BANNER'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryon_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public products viewable by all" ON products FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admin full product access" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('SUPER_ADMINISTRATOR', 'ADMINISTRATOR', 'CONTENT_EDITOR')
    )
);
