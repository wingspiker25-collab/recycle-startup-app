-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  address TEXT,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'driver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTPs
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY,
  email_or_phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invites
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY,
  email_or_phone TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'driver')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  created_by_admin_id UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pickups
CREATE TABLE IF NOT EXISTS pickups (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  scheduled_at TIMESTAMPTZ,
  pickup_status TEXT NOT NULL CHECK (
    pickup_status IN ('requested', 'accepted', 'driver_assigned', 'on_the_way', 'picked_up', 'cancelled')
  ) DEFAULT 'requested',
  address_text TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  driver_id UUID REFERENCES users(id),
  total_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  estimated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_amount_paid NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scrap items (line items per pickup)
CREATE TABLE IF NOT EXISTS scrap_items (
  id UUID PRIMARY KEY,
  pickup_id UUID NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  weight_kg DOUBLE PRECISION NOT NULL,
  rate_per_kg NUMERIC(10,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  pickup_id UUID NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pickup images
CREATE TABLE IF NOT EXISTS pickup_images (
  id UUID PRIMARY KEY,
  pickup_id UUID NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages (chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  pickup_id UUID REFERENCES pickups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_role TEXT NOT NULL CHECK (receiver_role IN ('user', 'admin', 'driver')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scrap rates (per category, versioned over time)
CREATE TABLE IF NOT EXISTS scrap_rates (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  rate_per_kg NUMERIC(10,2) NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_admin_id UUID NOT NULL REFERENCES users(id)
);

