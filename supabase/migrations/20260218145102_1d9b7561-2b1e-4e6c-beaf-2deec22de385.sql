
-- =============================================
-- 1. User Roles (enum + table)
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'influencer', 'client');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles, admins can read all
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. Profiles
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =============================================
-- 3. Companies (企業)
-- =============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies viewable by authenticated" ON public.companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Company can update own" ON public.companies
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Company can insert own" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =============================================
-- 4. Influencer Profiles (インフルエンサー)
-- =============================================
CREATE TABLE public.influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  category TEXT,
  instagram_followers INT DEFAULT 0,
  tiktok_followers INT DEFAULT 0,
  youtube_followers INT DEFAULT 0,
  twitter_followers INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.influencer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IF profiles viewable by authenticated" ON public.influencer_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "IF can update own" ON public.influencer_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "IF can insert own" ON public.influencer_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =============================================
-- 5. Campaigns (案件)
-- =============================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  budget_min INT DEFAULT 0,
  budget_max INT DEFAULT 0,
  platform TEXT,
  requirements TEXT,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'recruiting', 'in_progress', 'completed', 'cancelled')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view recruiting/in_progress campaigns; company owner and admin can see all their own
CREATE POLICY "Public campaigns viewable" ON public.campaigns
  FOR SELECT TO authenticated USING (
    status IN ('recruiting', 'in_progress', 'completed')
    OR company_id IN (SELECT c.id FROM public.companies c WHERE c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Company can insert campaigns" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (
    company_id IN (SELECT c.id FROM public.companies c WHERE c.user_id = auth.uid())
  );
CREATE POLICY "Company can update own campaigns" ON public.campaigns
  FOR UPDATE TO authenticated USING (
    company_id IN (SELECT c.id FROM public.companies c WHERE c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Company can delete own campaigns" ON public.campaigns
  FOR DELETE TO authenticated USING (
    company_id IN (SELECT c.id FROM public.companies c WHERE c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- 6. Applications (応募)
-- =============================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  influencer_id UUID REFERENCES public.influencer_profiles(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'approved', 'rejected', 'completed')),
  motivation TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Influencer can see own, company can see for own campaigns, admin can see all
CREATE POLICY "View own applications" ON public.applications
  FOR SELECT TO authenticated USING (
    influencer_id IN (SELECT ip.id FROM public.influencer_profiles ip WHERE ip.user_id = auth.uid())
    OR company_id IN (SELECT c.id FROM public.companies c WHERE c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "IF can insert applications" ON public.applications
  FOR INSERT TO authenticated WITH CHECK (
    influencer_id IN (SELECT ip.id FROM public.influencer_profiles ip WHERE ip.user_id = auth.uid())
  );
CREATE POLICY "Company/admin can update applications" ON public.applications
  FOR UPDATE TO authenticated USING (
    company_id IN (SELECT c.id FROM public.companies c WHERE c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- 7. Messages (メッセージ)
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR receiver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Receiver can update (mark read)" ON public.messages
  FOR UPDATE TO authenticated USING (receiver_id = auth.uid());

-- =============================================
-- 8. Notifications (通知)
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'scout', 'application')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System/admin can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =============================================
-- 9. Triggers for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_influencer_profiles_updated_at BEFORE UPDATE ON public.influencer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 10. Auto-create profile + role on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role app_role;
  _raw_meta jsonb;
BEGIN
  _raw_meta := NEW.raw_user_meta_data;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(_raw_meta->>'display_name', ''));
  
  -- Assign role based on metadata
  _role := COALESCE((_raw_meta->>'role')::app_role, 'influencer');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  
  -- Create role-specific profile
  IF _role = 'influencer' THEN
    INSERT INTO public.influencer_profiles (user_id, username, name)
    VALUES (NEW.id, COALESCE(_raw_meta->>'username', ''), COALESCE(_raw_meta->>'display_name', ''));
  ELSIF _role = 'client' THEN
    INSERT INTO public.companies (user_id, name, contact_name, contact_email)
    VALUES (NEW.id, COALESCE(_raw_meta->>'company_name', ''), COALESCE(_raw_meta->>'display_name', ''), NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
