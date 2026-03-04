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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find pending payments where campaign payment_date is within 3 days or overdue
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: pendingPayments, error } = await supabaseAdmin
      .from("payments")
      .select("*, campaigns(id, title, payment_date, company_id), companies(id, name, user_id)")
      .eq("status", "pending");

    if (error) throw error;

    let notified = 0;

    for (const payment of (pendingPayments || [])) {
      const paymentDate = payment.campaigns?.payment_date;
      if (!paymentDate) continue;

      const deadline = new Date(paymentDate);
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Notify if within 3 days or overdue
      if (diffDays > 3) continue;

      const companyUserId = payment.companies?.user_id;
      if (!companyUserId) continue;

      const isOverdue = diffDays < 0;
      const deadlineStr = deadline.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

      const title = isOverdue
        ? `⚠️ 振込期日超過: ${payment.campaigns?.title || "案件"}`
        : `⏰ 振込期日間近: ${payment.campaigns?.title || "案件"}`;

      const message = isOverdue
        ? `「${payment.campaigns?.title}」の振込期日（${deadlineStr}）を過ぎています。早急に振込を完了してください。金額: ¥${payment.amount.toLocaleString()}`
        : `「${payment.campaigns?.title}」の振込期日（${deadlineStr}）まであと${diffDays}日です。金額: ¥${payment.amount.toLocaleString()}`;

      // Check if we already sent a notification today for this payment
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { data: existing } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("user_id", companyUserId)
        .gte("created_at", todayStart)
        .like("title", `%${payment.campaigns?.title}%振込%`)
        .limit(1);

      if (existing && existing.length > 0) continue; // Already notified today

      await supabaseAdmin.from("notifications").insert({
        user_id: companyUserId,
        title,
        message,
        type: isOverdue ? "warning" : "info",
        link: "/client/payments",
      });

      notified++;
    }

    return new Response(JSON.stringify({ success: true, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
