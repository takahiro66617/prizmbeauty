import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "get_campaigns": {
        const { companyId, statuses } = body;
        let query = supabase
          .from("campaigns")
          .select("*, companies(id, name, logo_url)")
          .order("created_at", { ascending: false });

        if (companyId) query = query.eq("company_id", companyId);
        if (statuses && Array.isArray(statuses) && statuses.length > 0) {
          query = query.in("status", statuses);
        }

        const { data, error } = await query;
        if (error) return jsonError(error.message);
        return jsonOk(data);
      }

      case "update_campaign": {
        const { id, updates } = body;
        if (!id) return jsonError("id is required");
        // Convert empty strings to null for timestamp/numeric fields
        const cleaned = { ...updates };
        for (const key of ["deadline", "payment_date"]) {
          if (cleaned[key] === "") cleaned[key] = null;
        }
        // Ensure numeric fields are proper numbers
        for (const key of ["budget_min", "budget_max", "max_applicants"]) {
          if (cleaned[key] !== undefined) cleaned[key] = Number(cleaned[key]) || 0;
        }
        const { data, error } = await supabase.from("campaigns").update(cleaned).eq("id", id).select().single();
        if (error) return jsonError(error.message);
        return jsonOk(data);
      }

      case "delete_campaign": {
        const { id } = body;
        if (!id) return jsonError("id is required");
        const { error } = await supabase.from("campaigns").delete().eq("id", id);
        if (error) return jsonError(error.message);
        return jsonOk({ success: true });
      }

      case "get_applications": {
        const { companyId, campaignId, statuses } = body;
        let query = supabase
          .from("applications")
          .select("*, campaigns(id, title, image_url, budget_min, budget_max, deadline, category, description, deliverables, platform, requirements, companies(id, name)), influencer_profiles(id, name, username, image_url, instagram_followers, tiktok_followers, youtube_followers, twitter_followers, category, bio, status, user_id, instagram_url, tiktok_url, youtube_url, twitter_url)")
          .order("applied_at", { ascending: false });
        if (companyId) query = query.eq("company_id", companyId);
        if (campaignId) query = query.eq("campaign_id", campaignId);
        if (statuses && Array.isArray(statuses) && statuses.length > 0) {
          query = query.in("status", statuses);
        }
        const { data, error } = await query;
        if (error) return jsonError(error.message);
        return jsonOk(data);
      }

      case "update_application": {
        const { id, status } = body;
        if (!id || !status) return jsonError("id and status are required");
        const { data, error } = await supabase.from("applications").update({ status }).eq("id", id).select().single();
        if (error) return jsonError(error.message);
        return jsonOk(data);
      }

      case "update_company": {
        const { id, updates } = body;
        if (!id) return jsonError("id is required");
        const { data, error } = await supabase.from("companies").update(updates).eq("id", id).select().single();
        if (error) return jsonError(error.message);
        return jsonOk(data);
      }

      case "delete_company": {
        const { id } = body;
        if (!id) return jsonError("id is required");
        const { error } = await supabase.from("companies").delete().eq("id", id);
        if (error) return jsonError(error.message);
        return jsonOk({ success: true });
      }

      default:
        return jsonError("Unknown action: " + action, 400);
    }
  } catch (e) {
    return jsonError(e.message || "Internal error", 500);
  }
});

function jsonOk(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
