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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Get all approved applications
    const { data: approvedApps, error } = await supabaseAdmin
      .from("applications")
      .select("*, campaigns(id, title, company_id, companies(id, name, user_id)), influencer_profiles(id, name, username, user_id)")
      .eq("status", "approved");

    if (error) throw error;

    let expired = 0;
    let reminded = 0;

    for (const app of (approvedApps || [])) {
      const updatedAt = new Date(app.updated_at);
      const influencer = app.influencer_profiles;
      const campaign = app.campaigns;
      const companyUserId = campaign?.companies?.user_id;
      const influencerUserId = influencer?.user_id || influencer?.id;

      if (!influencer || !campaign) continue;

      // Check if there's any message from the influencer after approval
      const { data: influencerMessages } = await supabaseAdmin
        .from("messages")
        .select("id")
        .eq("application_id", app.id)
        .eq("sender_id", influencerUserId)
        .gte("created_at", app.updated_at)
        .limit(1);

      const hasResponded = influencerMessages && influencerMessages.length > 0;

      // === AUTO-EXPIRE: 7 days with no response ===
      if (!hasResponded && updatedAt <= sevenDaysAgo) {
        // 1. Reject the application
        await supabaseAdmin
          .from("applications")
          .update({ status: "rejected" })
          .eq("id", app.id);

        // 2. Reopen the campaign for new applicants
        await supabaseAdmin
          .from("campaigns")
          .update({ status: "recruiting" })
          .eq("id", campaign.id);

        // 3. Notify the influencer
        await supabaseAdmin.from("notifications").insert({
          user_id: influencerUserId,
          title: "⏰ 案件アサインが取り消されました",
          message: `「${campaign.title}」の採用通知から7日間ご連絡がなかったため、アサインが自動的に取り消されました。`,
          type: "warning",
          link: "/mypage/applications",
        });

        // 4. Send message to thread
        if (companyUserId) {
          await supabaseAdmin.from("messages").insert({
            sender_id: influencerUserId,
            receiver_id: companyUserId,
            content: `⏰ ${influencer.name}さんからの返信がなかったため、アサインが自動取り消しされました。案件は再度募集中に戻りました。新しいインフルエンサーを選定してください。`,
            application_id: app.id,
            message_type: "system",
            visibility: "admin_company",
          });
        }

        // 5. Notify the company
        if (companyUserId) {
          await supabaseAdmin.from("notifications").insert({
            user_id: companyUserId,
            title: "🔄 インフルエンサーのアサイン取消",
            message: `「${campaign.title}」に採用した${influencer.name}さんから7日間返信がなかったため、アサインが取り消されました。案件は再び募集中です。新しい応募者を選んでください。`,
            type: "warning",
            link: `/client/campaigns/${campaign.id}`,
          });
        }

        expired++;
        continue; // skip reminder if already expired
      }

      // === REMINDER: ~5 days with no response (2 days before expiry) ===
      if (!hasResponded && updatedAt <= fiveDaysAgo && updatedAt > sevenDaysAgo) {
        // Check if we already sent a reminder today
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const { data: existingReminder } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("user_id", influencerUserId)
          .gte("created_at", todayStart)
          .like("title", "%期限が迫っています%")
          .limit(1);

        if (existingReminder && existingReminder.length > 0) continue;

        const daysLeft = Math.ceil((updatedAt.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (1000 * 60 * 60 * 24));

        await supabaseAdmin.from("notifications").insert({
          user_id: influencerUserId,
          title: "⚠️ 案件承認の返信期限が迫っています",
          message: `「${campaign.title}」の採用通知への返信期限があと${daysLeft}日です。期限内にメッセージで返信がない場合、アサインは自動的に取り消されます。`,
          type: "warning",
          link: "/mypage/applications",
        });

        // Also send message in thread
        if (companyUserId) {
          await supabaseAdmin.from("messages").insert({
            sender_id: companyUserId,
            receiver_id: influencerUserId,
            content: `⚠️ リマインダー：「${campaign.title}」の採用承認から5日が経過しました。あと${daysLeft}日以内にご返信がない場合、アサインは自動的に取り消されます。メッセージにてご連絡をお願いします。`,
            application_id: app.id,
            message_type: "system",
            visibility: "all",
          });
        }

        reminded++;
      }
    }

    return new Response(JSON.stringify({ success: true, expired, reminded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
