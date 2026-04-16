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
        // Convert empty strings to null for timestamp/numeric/text fields
        const cleaned = { ...updates };
        for (const key of ["deadline", "payment_date"]) {
          if (cleaned[key] === "") cleaned[key] = null;
        }
        for (const key of ["description", "requirements", "deliverables", "prefecture"]) {
          if (cleaned[key] === "") cleaned[key] = null;
        }
        // Ensure numeric fields are proper numbers
        for (const key of ["budget_min", "budget_max", "max_applicants", "reward_amount"]) {
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

      case "get_app_setting": {
        const { key } = body;
        if (!key) return jsonError("key is required");
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", key)
          .single();
        if (error) return jsonError(error.message);
        return jsonOk(data?.value);
      }

      case "update_app_setting": {
        const { key, value } = body;
        if (!key) return jsonError("key is required");
        const { data, error } = await supabase
          .from("app_settings")
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
          .select()
          .single();
        if (error) return jsonError(error.message);
        return jsonOk(data);
      }

      case "generate_invoices": {
        const billingMonth = body.billing_month || new Date().toISOString().slice(0, 7);

        // Get all completed campaigns with reward_amount > 0 that aren't already invoiced
        const { data: completedCampaigns, error: cErr } = await supabase
          .from("campaigns")
          .select("id, company_id, title, reward_amount")
          .eq("status", "completed")
          .gt("reward_amount", 0);
        if (cErr) return jsonError(cErr.message);
        if (!completedCampaigns || completedCampaigns.length === 0) {
          return jsonError("請求対象の完了案件がありません");
        }

        // Group by company
        const byCompany: Record<string, typeof completedCampaigns> = {};
        completedCampaigns.forEach((c: any) => {
          if (!byCompany[c.company_id]) byCompany[c.company_id] = [];
          byCompany[c.company_id].push(c);
        });

        const results: any[] = [];
        let invoiceSeq = 1;

        for (const [companyId, campaigns] of Object.entries(byCompany)) {
          const totalReward = campaigns.reduce((s: number, c: any) => s + (c.reward_amount || 0), 0);
          const systemFee = Math.floor(totalReward * 30 / 100);
          const taxAmount = Math.floor((totalReward + systemFee) * 10 / 100);
          const grandTotal = totalReward + systemFee + taxAmount;
          const invoiceNumber = `INV-${billingMonth.replace("-", "")}-${String(invoiceSeq++).padStart(3, "0")}`;

          // Create invoice
          const { data: invoice, error: iErr } = await supabase.from("invoices").insert({
            company_id: companyId,
            billing_month: billingMonth,
            total_reward_amount: totalReward,
            system_fee_amount: systemFee,
            tax_amount: taxAmount,
            grand_total: grandTotal,
            status: "issued",
            invoice_number: invoiceNumber,
          }).select().single();
          if (iErr) return jsonError(iErr.message);

          // Create invoice items
          const items = campaigns.map((c: any) => ({
            invoice_id: invoice.id,
            campaign_id: c.id,
            campaign_title: c.title,
            reward_amount: c.reward_amount || 0,
            fee_amount: Math.floor((c.reward_amount || 0) * 30 / 100),
          }));
          const { error: iiErr } = await supabase.from("invoice_items").insert(items);
          if (iiErr) return jsonError(iiErr.message);

          // Update campaign statuses to invoiced
          const campaignIds = campaigns.map((c: any) => c.id);
          const { error: uErr } = await supabase.from("campaigns").update({ status: "invoiced" }).in("id", campaignIds);
          if (uErr) return jsonError(uErr.message);

          // Send notification to company
          const { data: comp } = await supabase.from("companies").select("user_id").eq("id", companyId).single();
          if (comp?.user_id) {
            await supabase.from("notifications").insert({
              user_id: comp.user_id,
              title: "請求書が発行されました",
              message: `${billingMonth}月分の請求書（${invoiceNumber}）が発行されました。請求・支払い管理画面をご確認ください。`,
              type: "billing",
              link: "/client/billing",
            });
          }

          results.push(invoice);
        }

        return jsonOk({ invoices: results, count: results.length });
      }

      case "get_invoices": {
        const { companyId: filterCompanyId, status: filterStatus } = body;
        let query = supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false });
        if (filterCompanyId) query = query.eq("company_id", filterCompanyId);
        if (filterStatus && filterStatus !== "all") query = query.eq("status", filterStatus);
        const { data: invoicesData, error } = await query;
        if (error) return jsonError(error.message);

        // Enrich with company names
        const companyIds = [...new Set((invoicesData || []).map((i: any) => i.company_id))];
        let companyMap: Record<string, any> = {};
        if (companyIds.length > 0) {
          const { data: companies } = await supabase.from("companies").select("id, name, logo_url").in("id", companyIds);
          (companies || []).forEach((c: any) => { companyMap[c.id] = c; });
        }
        const enriched = (invoicesData || []).map((inv: any) => ({ ...inv, companies: companyMap[inv.company_id] || null }));
        return jsonOk(enriched);
      }

      case "get_invoice_detail": {
        const { invoiceId } = body;
        if (!invoiceId) return jsonError("invoiceId is required");
        const { data: invoice, error: iErr } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();
        if (iErr) return jsonError(iErr.message);

        // Get company info
        const { data: company } = await supabase.from("companies").select("id, name, logo_url, contact_name, contact_email").eq("id", invoice.company_id).single();

        const { data: items, error: iiErr } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("created_at", { ascending: true });
        if (iiErr) return jsonError(iiErr.message);

        return jsonOk({ ...invoice, companies: company, items: items || [] });
      }

      case "update_invoice_status": {
        const { invoiceId, status: newStatus } = body;
        if (!invoiceId || !newStatus) return jsonError("invoiceId and status are required");
        const allowed = ["pending", "issued", "paid"];
        if (!allowed.includes(newStatus)) return jsonError("invalid status");
        const { data, error } = await supabase.from("invoices").update({ status: newStatus }).eq("id", invoiceId).select().single();
        if (error) return jsonError(error.message);
        return jsonOk(data);
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
