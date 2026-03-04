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

      case "get_debug_reports": {
        const { status } = body;
        let query = supabase
          .from("debug_reports")
          .select("*")
          .order("created_at", { ascending: false });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) return jsonError(error.message);
        return jsonOk(data);
      }

      case "update_debug_report_status": {
        const { id, status } = body;
        const allowedStatuses = ["open", "in_progress", "resolved", "wontfix"];

        if (!id || !status) return jsonError("id and status are required");
        if (!allowedStatuses.includes(status)) return jsonError("invalid status");

        const { data, error } = await supabase
          .from("debug_reports")
          .update({ status })
          .eq("id", id)
          .select()
          .single();

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

      case "get_payments": {
        const { companyId } = body;
        let query = supabase
          .from("payments")
          .select("*, campaigns(id, title, image_url, payment_date, budget_min, budget_max)")
          .order("created_at", { ascending: false });
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query;
        if (error) return jsonError(error.message);

        // Enrich with influencer profiles and bank accounts
        const influencerIds = [...new Set((data || []).map((p: any) => p.influencer_user_id))];
        let influencerMap: Record<string, any> = {};
        let bankMap: Record<string, any> = {};
        if (influencerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("influencer_profiles")
            .select("id, name, username, image_url, user_id")
            .or(influencerIds.map(id => `user_id.eq.${id},id.eq.${id}`).join(","));
          if (profiles) {
            profiles.forEach((p: any) => {
              if (p.user_id) influencerMap[p.user_id] = p;
              influencerMap[p.id] = p;
            });
          }
          // Fetch bank accounts for these influencers
          const bankUserIds = [...new Set([
            ...influencerIds,
            ...(profiles || []).filter((p: any) => p.id).map((p: any) => p.id),
          ])];
          const { data: banks } = await supabase
            .from("bank_accounts")
            .select("*")
            .in("user_id", bankUserIds);
          if (banks) {
            banks.forEach((b: any) => {
              bankMap[b.user_id] = b;
            });
          }
        }

        const enriched = (data || []).map((p: any) => {
          const profile = influencerMap[p.influencer_user_id] || null;
          const bankAccount = bankMap[p.influencer_user_id] || (profile ? bankMap[profile.id] : null) || null;
          return { ...p, influencer_profiles: profile, bank_account: bankAccount };
        });
        return jsonOk(enriched);
      }

      case "send_admin_notification": {
        const { targetType, targetIds, title, message, type, link } = body;
        // targetType: "influencer" | "company" | "all_influencers" | "all_companies" | "all"
        let userIds: string[] = [];

        if (targetType === "influencer" && targetIds?.length) {
          // Get user_ids from influencer_profiles
          const { data: profiles } = await supabase.from("influencer_profiles").select("user_id").in("id", targetIds);
          userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean);
        } else if (targetType === "company" && targetIds?.length) {
          const { data: comps } = await supabase.from("companies").select("user_id").in("id", targetIds);
          userIds = (comps || []).map((c: any) => c.user_id).filter(Boolean);
        } else if (targetType === "all_influencers") {
          const { data: profiles } = await supabase.from("influencer_profiles").select("user_id").not("user_id", "is", null);
          userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean);
        } else if (targetType === "all_companies") {
          const { data: comps } = await supabase.from("companies").select("user_id");
          userIds = (comps || []).map((c: any) => c.user_id).filter(Boolean);
        } else if (targetType === "all") {
          const { data: profiles } = await supabase.from("influencer_profiles").select("user_id").not("user_id", "is", null);
          const { data: comps } = await supabase.from("companies").select("user_id");
          userIds = [
            ...(profiles || []).map((p: any) => p.user_id),
            ...(comps || []).map((c: any) => c.user_id),
          ].filter(Boolean);
        }

        if (userIds.length === 0) return jsonError("送信対象が見つかりません");

        const notifications = userIds.map((uid: string) => ({
          user_id: uid,
          title: title || "お知らせ",
          message: message || "",
          type: type || "info",
          link: link || null,
          read: false,
        }));

        const { error: insertErr } = await supabase.from("notifications").insert(notifications);
        if (insertErr) return jsonError(insertErr.message);
        return jsonOk({ sent: userIds.length });
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
