import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "Missing companyId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify this user owns the company
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!company) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get payments with campaigns
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("*, campaigns(id, title, payment_date, image_url, budget_min, budget_max)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get influencer profiles and bank accounts
    const influencerIds = [...new Set((payments || []).map((p: any) => p.influencer_user_id))];
    let influencerMap: Record<string, any> = {};
    let bankMap: Record<string, any> = {};

    if (influencerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("influencer_profiles")
        .select("id, name, username, image_url, user_id")
        .or(influencerIds.map(id => `user_id.eq.${id},id.eq.${id}`).join(","));

      if (profiles) {
        profiles.forEach((p: any) => {
          if (p.user_id) influencerMap[p.user_id] = p;
          influencerMap[p.id] = p;
        });
      }

      const { data: banks } = await supabaseAdmin
        .from("bank_accounts")
        .select("*")
        .in("user_id", influencerIds);

      if (banks) {
        banks.forEach((b: any) => { bankMap[b.user_id] = b; });
      }
    }

    const enriched = (payments || []).map((p: any) => {
      const profile = influencerMap[p.influencer_user_id] || null;
      const bankAccount = bankMap[p.influencer_user_id] || null;
      return { ...p, influencer_profiles: profile, bank_account: bankAccount };
    });

    return new Response(JSON.stringify({ data: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
