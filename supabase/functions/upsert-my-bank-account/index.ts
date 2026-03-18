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

    // Verify the influencer profile exists — search by both id and user_id for robustness
    const { data: profile } = await supabaseAdmin
      .from("influencer_profiles")
      .select("id, user_id")
      .or(`id.eq.${influencerProfileId},user_id.eq.${influencerProfileId}`)
      .maybeSingle();

    if (!profile) {
      console.error("Profile not found for:", influencerProfileId);
      return new Response(JSON.stringify({ error: "インフルエンサープロフィールが見つかりません。再ログインしてください。" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the influencerProfileId as the bank_accounts.user_id (consistent with how it was stored)
    const bankUserId = influencerProfileId;
    const accountData = { bank_name, branch_name, account_type, account_number, account_holder };

    // Check if exists — search by both the provided ID and the profile's user_id/id
    const searchIds = [influencerProfileId];
    if (profile.user_id && profile.user_id !== influencerProfileId) searchIds.push(profile.user_id);
    if (profile.id && profile.id !== influencerProfileId) searchIds.push(profile.id);

    const { data: existing } = await supabaseAdmin
      .from("bank_accounts")
      .select("id, user_id")
      .in("user_id", searchIds)
      .maybeSingle();

    let data, error;
    if (existing) {
      ({ data, error } = await supabaseAdmin
        .from("bank_accounts")
        .update(accountData)
        .eq("id", existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabaseAdmin
        .from("bank_accounts")
        .insert({ ...accountData, user_id: bankUserId })
        .select()
        .single());
    }

    if (error) {
      console.error("Bank account upsert DB error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("upsert-my-bank-account error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
