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
    if (!influencerProfileId) {
      return new Response(JSON.stringify({ error: "Missing influencerProfileId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // If campaignId is provided, check single favorite
    if (campaignId) {
      const { data } = await supabaseAdmin
        .from("favorites")
        .select("id")
        .eq("user_id", influencerProfileId)
        .eq("campaign_id", campaignId)
        .maybeSingle();
      return new Response(JSON.stringify({ isFavorite: !!data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Otherwise return all favorites
    const { data, error } = await supabaseAdmin
      .from("favorites")
      .select("*, campaigns(*, companies(id, name, logo_url))")
      .eq("user_id", influencerProfileId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
