-- Create direct_user_discounts table
CREATE TABLE IF NOT EXISTS direct_user_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discount_price DECIMAL(10, 2) NOT NULL CHECK (discount_price >= 0 AND discount_price <= 9.90),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, deleted_at) WHERE deleted_at IS NULL
);

-- Create discount_links table
CREATE TABLE IF NOT EXISTS discount_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  discount_price DECIMAL(10, 2) NOT NULL CHECK (discount_price >= 0 AND discount_price <= 9.90),
  max_redemptions INT NOT NULL CHECK (max_redemptions > 0),
  current_redemptions INT DEFAULT 0 CHECK (current_redemptions >= 0 AND current_redemptions <= max_redemptions),
  expiration_date TIMESTAMP NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create coupon_codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  discount_price DECIMAL(10, 2) NOT NULL CHECK (discount_price >= 0 AND discount_price <= 9.90),
  max_redemptions INT NOT NULL CHECK (max_redemptions > 0),
  current_redemptions INT DEFAULT 0 CHECK (current_redemptions >= 0 AND current_redemptions <= max_redemptions),
  expiration_date TIMESTAMP NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create discount_redemptions table
CREATE TABLE IF NOT EXISTS discount_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('direct_user', 'link', 'coupon')),
  discount_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id VARCHAR(255) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount >= 0),
  final_price DECIMAL(10, 2) NOT NULL CHECK (final_price >= 0),
  redeemed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create discount_audit_logs table
CREATE TABLE IF NOT EXISTS discount_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'redeem')),
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('direct_user', 'link', 'coupon')),
  discount_id UUID,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changes_made JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_direct_user_discounts_user_id ON direct_user_discounts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_direct_user_discounts_created_by ON direct_user_discounts(created_by);
CREATE INDEX idx_direct_user_discounts_is_active ON direct_user_discounts(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_discount_links_token ON discount_links(token);
CREATE INDEX idx_discount_links_created_by ON discount_links(created_by);
CREATE INDEX idx_discount_links_expiration_date ON discount_links(expiration_date);
CREATE INDEX idx_discount_links_is_active ON discount_links(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_codes_created_by ON coupon_codes(created_by);
CREATE INDEX idx_coupon_codes_expiration_date ON coupon_codes(expiration_date);
CREATE INDEX idx_coupon_codes_is_active ON coupon_codes(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_discount_redemptions_discount_type_id ON discount_redemptions(discount_type, discount_id);
CREATE INDEX idx_discount_redemptions_user_id ON discount_redemptions(user_id);
CREATE INDEX idx_discount_redemptions_subscription_id ON discount_redemptions(subscription_id);
CREATE INDEX idx_discount_redemptions_redeemed_at ON discount_redemptions(redeemed_at);

CREATE INDEX idx_discount_audit_logs_discount_type_id ON discount_audit_logs(discount_type, discount_id);
CREATE INDEX idx_discount_audit_logs_admin_id ON discount_audit_logs(admin_id);
CREATE INDEX idx_discount_audit_logs_created_at ON discount_audit_logs(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE direct_user_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_user_discounts
CREATE POLICY "Allow admins to view all direct user discounts" ON direct_user_discounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to create direct user discounts" ON direct_user_discounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to update direct user discounts" ON direct_user_discounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to delete direct user discounts" ON direct_user_discounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for discount_links
CREATE POLICY "Allow admins to view all discount links" ON discount_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to create discount links" ON discount_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to update discount links" ON discount_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to delete discount links" ON discount_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for coupon_codes
CREATE POLICY "Allow admins to view all coupon codes" ON coupon_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to create coupon codes" ON coupon_codes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to update coupon codes" ON coupon_codes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow admins to delete coupon codes" ON coupon_codes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for discount_redemptions (read-only for admins)
CREATE POLICY "Allow admins to view all redemptions" ON discount_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow system to insert redemptions" ON discount_redemptions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for discount_audit_logs (read-only for admins)
CREATE POLICY "Allow admins to view audit logs" ON discount_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow system to insert audit logs" ON discount_audit_logs
  FOR INSERT WITH CHECK (true);
