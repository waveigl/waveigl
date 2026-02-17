-- Create subscribers table for storing Twitch subscriber data
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(255) NOT NULL,
  twitch_user_id VARCHAR(255) NOT NULL,
  twitch_username VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) NOT NULL CHECK (subscription_tier IN ('tier_1', 'tier_2', 'tier_3')),
  subscription_date TIMESTAMP NOT NULL,
  subscription_status VARCHAR(50) NOT NULL CHECK (subscription_status IN ('active', 'inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates per channel
  UNIQUE(channel_id, twitch_user_id)
);

-- Create index for fast lookups by channel and twitch user
CREATE INDEX IF NOT EXISTS idx_subscribers_channel_twitch_user 
  ON subscribers(channel_id, twitch_user_id);

-- Create index for filtering by channel and status
CREATE INDEX IF NOT EXISTS idx_subscribers_channel_status 
  ON subscribers(channel_id, subscription_status);

-- Create index for sorting by subscription date
CREATE INDEX IF NOT EXISTS idx_subscribers_channel_date 
  ON subscribers(channel_id, subscription_date DESC);

-- Create subscriber_contacts table for tracking message sends
CREATE TABLE IF NOT EXISTS subscriber_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  message_sent_at TIMESTAMP,
  contact_status VARCHAR(50) NOT NULL DEFAULT 'not_sent' CHECK (contact_status IN ('sent', 'not_sent', 'failed', 'blocked', 'banned')),
  error_message TEXT,
  sent_by_admin_id VARCHAR(255), -- Track which admin sent the message
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups by subscriber
CREATE INDEX IF NOT EXISTS idx_subscriber_contacts_subscriber_id 
  ON subscriber_contacts(subscriber_id);

-- Create index for filtering by contact status
CREATE INDEX IF NOT EXISTS idx_subscriber_contacts_status 
  ON subscriber_contacts(contact_status);

-- Create index for finding uncontacted subscribers
CREATE INDEX IF NOT EXISTS idx_subscriber_contacts_uncontacted 
  ON subscriber_contacts(contact_status) 
  WHERE contact_status IN ('not_sent', 'failed');

-- Create admin_action_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(255) NOT NULL,
  admin_id VARCHAR(255) NOT NULL,
  admin_username VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('sync', 'send_messages', 'manual_contact_update')),
  action_details JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for audit trail lookups
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_channel 
  ON admin_action_logs(channel_id, created_at DESC);

-- Create index for admin activity tracking
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin 
  ON admin_action_logs(admin_id, created_at DESC);

-- Enable Row Level Security (RLS) for security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscribers table
-- Allow channel owner and admins to view subscribers
CREATE POLICY "Channel members can view subscribers"
  ON subscribers FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id FROM user_channel_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Allow channel owner and admins to insert/update subscribers
CREATE POLICY "Channel members can manage subscribers"
  ON subscribers FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT channel_id FROM user_channel_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Channel members can update subscribers"
  ON subscribers FOR UPDATE
  USING (
    channel_id IN (
      SELECT channel_id FROM user_channel_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Create RLS policies for subscriber_contacts table
CREATE POLICY "Channel members can view contacts"
  ON subscriber_contacts FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers 
      WHERE channel_id IN (
        SELECT channel_id FROM user_channel_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Channel members can manage contacts"
  ON subscriber_contacts FOR INSERT
  WITH CHECK (
    subscriber_id IN (
      SELECT id FROM subscribers 
      WHERE channel_id IN (
        SELECT channel_id FROM user_channel_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Channel members can update contacts"
  ON subscriber_contacts FOR UPDATE
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers 
      WHERE channel_id IN (
        SELECT channel_id FROM user_channel_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
  );

-- Create RLS policies for admin_action_logs table
CREATE POLICY "Channel members can view action logs"
  ON admin_action_logs FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id FROM user_channel_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Channel members can insert action logs"
  ON admin_action_logs FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT channel_id FROM user_channel_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
