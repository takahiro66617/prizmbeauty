
-- Bank account info for influencers
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL DEFAULT '',
  branch_name TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL DEFAULT 'ordinary',
  account_number TEXT NOT NULL DEFAULT '',
  account_holder TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank account" ON public.bank_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own bank account" ON public.bank_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bank account" ON public.bank_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin can view all bank accounts" ON public.bank_accounts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payment records for completed work
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id),
  influencer_user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencer can view own payments" ON public.payments FOR SELECT USING (influencer_user_id = auth.uid());
CREATE POLICY "Company can view own payments" ON public.payments FOR SELECT USING (company_id IN (SELECT c.id FROM companies c WHERE c.user_id = auth.uid()));
CREATE POLICY "Company can insert payments" ON public.payments FOR INSERT WITH CHECK (company_id IN (SELECT c.id FROM companies c WHERE c.user_id = auth.uid()));
CREATE POLICY "Company can update own payments" ON public.payments FOR UPDATE USING (company_id IN (SELECT c.id FROM companies c WHERE c.user_id = auth.uid()));
CREATE POLICY "Admin can view all payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
