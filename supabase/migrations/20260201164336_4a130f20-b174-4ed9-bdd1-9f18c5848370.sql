-- Devices table for anonymous users (no PII, just device fingerprint)
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  verified_at TIMESTAMP WITH TIME ZONE,
  daily_specific_matches INTEGER DEFAULT 0,
  last_match_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table for pseudonymous data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Matching queue for real-time pairing
CREATE TABLE public.matching_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE UNIQUE,
  preferred_gender TEXT CHECK (preferred_gender IN ('male', 'female', 'any')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat sessions for active 1-to-1 conversations
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_a UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  device_b UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_by UUID REFERENCES public.devices(id),
  CONSTRAINT different_devices CHECK (device_a != device_b)
);

-- Messages for ephemeral chat (stored temporarily for real-time sync)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reports table for abuse prevention
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  reported_device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cooldowns for spam prevention
CREATE TABLE public.cooldowns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  cooldown_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooldowns ENABLE ROW LEVEL SECURITY;

-- Public policies for anonymous access (since no auth, we use device fingerprint validation via edge functions)
-- Devices: anyone can insert their own device, read their own
CREATE POLICY "Anyone can register a device" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Anyone can update devices" ON public.devices FOR UPDATE USING (true);

-- Profiles: public access (managed via edge functions)
CREATE POLICY "Anyone can manage profiles" ON public.profiles FOR ALL USING (true);

-- Matching queue: public access
CREATE POLICY "Anyone can manage queue" ON public.matching_queue FOR ALL USING (true);

-- Chat sessions: public access
CREATE POLICY "Anyone can manage chat sessions" ON public.chat_sessions FOR ALL USING (true);

-- Messages: public access
CREATE POLICY "Anyone can manage messages" ON public.messages FOR ALL USING (true);

-- Reports: public access
CREATE POLICY "Anyone can manage reports" ON public.reports FOR ALL USING (true);

-- Cooldowns: public access
CREATE POLICY "Anyone can manage cooldowns" ON public.cooldowns FOR ALL USING (true);

-- Enable realtime for messages and matching_queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matching_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

-- Create indexes for performance
CREATE INDEX idx_matching_queue_device ON public.matching_queue(device_id);
CREATE INDEX idx_matching_queue_gender ON public.matching_queue(preferred_gender);
CREATE INDEX idx_messages_session ON public.messages(session_id);
CREATE INDEX idx_chat_sessions_devices ON public.chat_sessions(device_a, device_b);
CREATE INDEX idx_devices_fingerprint ON public.devices(fingerprint);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();