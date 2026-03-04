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
    const { influencerProfileId, bank_name, branch_name, account_type, account_number, account_holder } = await req.json();
    if (!influencerProfileId) {
      return new Response(JSON.stringify({ error: "Missing influencerProfileId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the influencer profile exists
    const { data: profile } = await supabaseAdmin
      .from("influencer_profiles")
      .select("id")
      .eq("id", influencerProfileId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Invalid influencer profile" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountData = { bank_name, branch_name, account_type, account_number, account_holder };

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from("bank_accounts")
      .select("id")
      .eq("user_id", influencerProfileId)
      .maybeSingle();

    let data, error;
    if (existing) {
      ({ data, error } = await supabaseAdmin
        .from("bank_accounts")
        .update(accountData)
        .eq("user_id", influencerProfileId)
        .select()
        .single());
    } else {
      ({ data, error } = await supabaseAdmin
        .from("bank_accounts")
        .insert({ ...accountData, user_id: influencerProfileId })
        .select()
        .single());
    }

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
