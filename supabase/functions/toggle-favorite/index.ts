import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { influencerProfileId, campaignId } = await req.json();
    if (!influencerProfileId || !campaignId) {
      return new Response(JSON.stringify({ error: "Missing influencerProfileId or campaignId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use influencerProfileId as the user_id for favorites (since LINE users don't have auth user_id)
    const { data: existing } = await supabaseAdmin
      .from("favorites")
      .select("id")
      .eq("user_id", influencerProfileId)
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("favorites").delete().eq("id", existing.id);
      return new Response(JSON.stringify({ action: "removed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const { error } = await supabaseAdmin.from("favorites").insert({
        user_id: influencerProfileId,
        campaign_id: campaignId,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ action: "added" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
