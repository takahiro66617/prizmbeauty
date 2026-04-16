
-- 1. Add reward_amount to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS reward_amount integer DEFAULT 0;

-- 2. Update CHECK constraint to include 'invoiced'
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check CHECK (status = ANY (ARRAY['draft','pending_approval','approved','rejected','recruiting','in_progress','closed','completed','cancelled','invoiced']));

-- 3. Create invoices table
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  billing_month text NOT NULL,
  total_reward_amount integer NOT NULL DEFAULT 0,
  system_fee_amount integer NOT NULL DEFAULT 0,
  tax_amount integer NOT NULL DEFAULT 0,
  grand_total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  invoice_number text,
  issued_at timestamp with time zone DEFAULT now(),
  due_date text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Company can view own invoices
CREATE POLICY "Company can view own invoices" ON public.invoices FOR SELECT TO authenticated
  USING (company_id IN (SELECT c.id FROM companies c WHERE c.user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create invoice_items table
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL,
  campaign_title text NOT NULL DEFAULT '',
  reward_amount integer NOT NULL DEFAULT 0,
  fee_amount integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage invoice_items" ON public.invoice_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Company can view own invoice items (through invoices)
CREATE POLICY "Company can view own invoice_items" ON public.invoice_items FOR SELECT TO authenticated
  USING (invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN companies c ON i.company_id = c.id
    WHERE c.user_id = auth.uid()
  ));
