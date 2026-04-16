import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- LINE Push Helper ---
async function trySendLinePush(supabaseAdmin: any, lineUserId: string | null, influencerId: string | null, message: string, messageType: string) {
  if (!lineUserId) return;
  try {
    const { data: config } = await supabaseAdmin
      .from("app_settings").select("value").eq("key", "line_messaging_config").single();
    const token = config?.value?.channel_access_token;
    if (!token) { console.log("LINE token not configured, skipping push"); return; }

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text: message }] }),
    });
    const ok = res.ok;
    const errText = ok ? null : await res.text();
    if (!ok) console.error("LINE push failed:", res.status, errText);
    else await res.text();

    await supabaseAdmin.from("line_message_logs").insert({
      influencer_id: influencerId, line_user_id: lineUserId,
      message_type: messageType, message_content: message,
      status: ok ? "sent" : "failed", error_detail: errText, sent_by: "system",
    });
  } catch (e) {
    console.error("LINE push error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { applicationId, newStatus, message, notificationTitle, notificationMessage, notificationType, notificationLink } = await req.json();
    if (!applicationId || !newStatus) {
      return new Response(JSON.stringify({ error: "Missing applicationId or newStatus" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Update application status
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId)
      .select("*, campaigns(id, title, budget_min, budget_max, deadline, description, deliverables, platform, requirements, payment_date, companies(id, name)), influencer_profiles(id, name, username, user_id, line_user_id)")
      .single();

    if (updateError) throw updateError;

    const influencer = updatedApp.influencer_profiles;
    const senderId = updatedApp.campaigns?.companies?.id || null;

    // 2. Send message if provided - use influencer_profile.id as fallback receiver
    if (message && influencer) {
      const receiverId = influencer.user_id || influencer.id;
      try {
        // Get the company's user_id for sender
        const { data: company } = await supabaseAdmin
          .from("companies")
          .select("user_id")
          .eq("id", updatedApp.company_id)
          .single();
        
        console.log("Sending message:", { sender: company?.user_id, receiver: receiverId });
        const { error: msgError } = await supabaseAdmin.from("messages").insert({
          sender_id: company?.user_id || updatedApp.company_id,
          receiver_id: receiverId,
          content: message,
          application_id: applicationId,
        });
        if (msgError) console.error("Message insert error:", msgError);
      } catch (e) {
        console.error("Failed to send message:", e);
      }
    }

    // 3. Send notification if provided
    if (notificationTitle && influencer) {
      const targetUserId = influencer.user_id || influencer.id;
      try {
        console.log("Sending notification:", { user_id: targetUserId, title: notificationTitle });
        const { error: notifError } = await supabaseAdmin.from("notifications").insert({
          user_id: targetUserId,
          title: notificationTitle,
          message: notificationMessage || notificationTitle,
          type: notificationType || "info",
          link: notificationLink || "/mypage/applications",
        });
        if (notifError) console.error("Notification insert error:", notifError);
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    }

    // 4. Auto-close campaign when influencer is approved + send 7-day deadline notice
    if (newStatus === "approved") {
      try {
        await supabaseAdmin.from("campaigns")
          .update({ status: "closed" })
          .eq("id", updatedApp.campaign_id);
        console.log("Campaign auto-closed:", updatedApp.campaign_id);
      } catch (e) {
        console.error("Failed to auto-close campaign:", e);
      }

      // Send 7-day response deadline notification to the influencer
      if (influencer) {
        const targetUserId = influencer.user_id || influencer.id;
        const campaignTitle = updatedApp.campaigns?.title || "案件";
        const deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const deadlineStr = deadlineDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

        try {
          // Notification about 7-day deadline
          await supabaseAdmin.from("notifications").insert({
            user_id: targetUserId,
            title: "🎉 案件に採用されました！（7日以内に返信が必要です）",
            message: `「${campaignTitle}」に採用されました！おめでとうございます🎊\n\n⚠️ 重要：${deadlineStr}までにメッセージで返信がない場合、アサインは自動的に取り消されます。お早めにご確認・ご返信をお願いします。`,
            type: "success",
            link: "/mypage/applications",
          });

          // Also send a thread message about the deadline
          const companyData2 = await supabaseAdmin
            .from("companies")
            .select("user_id")
            .eq("id", updatedApp.company_id)
            .single();

          if (companyData2.data?.user_id) {
            await supabaseAdmin.from("messages").insert({
              sender_id: companyData2.data.user_id,
              receiver_id: targetUserId,
              content: `🎉 「${campaignTitle}」に採用されました！\n\n📌 重要なお知らせ：\n採用承認から7日以内（${deadlineStr}まで）にこのスレッドでご返信をお願いします。\n\n期限内にご返信がない場合、アサインは自動的に取り消され、案件は再募集となります。\n\nご不明な点がございましたら、お気軽にメッセージでご連絡ください。`,
              application_id: applicationId,
              message_type: "system",
              visibility: "all",
            });
          }
        } catch (e) {
          console.error("Failed to send approval deadline notice:", e);
        }
      }
    }

    // 5. Auto-send bank account info + payment date when post is confirmed
    if (newStatus === "post_confirmed" && influencer) {
      const targetUserId = influencer.user_id || influencer.id;
      try {
        // Search bank account by multiple possible IDs (user_id, influencer profile id)
        const searchIds = [targetUserId];
        if (influencer.id && influencer.id !== targetUserId) searchIds.push(influencer.id);
        if (influencer.user_id && influencer.user_id !== targetUserId) searchIds.push(influencer.user_id);

        const { data: bankAccount } = await supabaseAdmin
          .from("bank_accounts")
          .select("*")
          .in("user_id", searchIds)
          .maybeSingle();

        // Get company user_id for receiver
        const { data: companyData } = await supabaseAdmin
          .from("companies")
          .select("user_id")
          .eq("id", updatedApp.company_id)
          .single();

        // Format payment date
        const paymentDate = updatedApp.campaigns?.payment_date
          ? new Date(updatedApp.campaigns.payment_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
          : "未設定";

        if (bankAccount && bankAccount.bank_name) {
          const bankContent = `🏦 振込先情報（自動送信）\n\n銀行名: ${bankAccount.bank_name}\n支店名: ${bankAccount.branch_name}\n口座種別: ${bankAccount.account_type === "ordinary" ? "普通" : bankAccount.account_type === "current" ? "当座" : bankAccount.account_type}\n口座番号: ${bankAccount.account_number}\n口座名義: ${bankAccount.account_holder}\n\n💰 振込予定日: ${paymentDate}`;

          const { error: bankMsgError } = await supabaseAdmin.from("messages").insert({
            sender_id: targetUserId,
            receiver_id: companyData?.user_id || updatedApp.company_id,
            content: bankContent,
            application_id: applicationId,
            message_type: "bank_info",
            visibility: "all",
          });
          if (bankMsgError) console.error("Bank info message error:", bankMsgError);
        } else {
          // Send message to company that bank info is not registered yet
          const noBankForCompany = `⚠️ 振込先情報が未登録です。\n\nインフルエンサーに口座登録を依頼しています。登録され次第、振込先情報が共有されます。\n\n💰 振込予定日: ${paymentDate}`;
          const { error: noBankCompanyError } = await supabaseAdmin.from("messages").insert({
            sender_id: targetUserId,
            receiver_id: companyData?.user_id || updatedApp.company_id,
            content: noBankForCompany,
            application_id: applicationId,
            message_type: "text",
            visibility: "admin_company",
          });
          if (noBankCompanyError) console.error("No bank info company message error:", noBankCompanyError);

          // Notify influencer to register bank account
          const noBankContent = `⚠️ 振込先情報が未登録です。\n\nマイページの「報酬管理」から振込先口座を登録してください。登録後、企業への振込先共有が可能になります。\n\n💰 振込予定日: ${paymentDate}`;
          const { error: noBankMsgError } = await supabaseAdmin.from("messages").insert({
            sender_id: companyData?.user_id || updatedApp.company_id,
            receiver_id: targetUserId,
            content: noBankContent,
            application_id: applicationId,
            message_type: "text",
            visibility: "admin_influencer",
          });
          if (noBankMsgError) console.error("No bank info notification error:", noBankMsgError);

          // Also create a notification
          await supabaseAdmin.from("notifications").insert({
            user_id: targetUserId,
            title: "振込先口座を登録してください",
            message: `「${updatedApp.campaigns?.title || "案件"}」の投稿が承認されました。報酬を受け取るために振込先口座を登録してください。振込予定日: ${paymentDate}`,
            type: "warning",
            link: "/mypage/rewards",
          });
        }
      } catch (e) {
        console.error("Failed to send bank info:", e);
      }
    }

    // 6. Auto-create payment record when advancing to payment_pending
    if (newStatus === "payment_pending" && influencer) {
      const amount = updatedApp.campaigns?.budget_max || updatedApp.campaigns?.budget_min || 0;
      const targetUserId = influencer.user_id || influencer.id;
      try {
        await supabaseAdmin.from("payments").insert({
          application_id: applicationId,
          campaign_id: updatedApp.campaign_id,
          company_id: updatedApp.company_id,
          influencer_user_id: targetUserId,
          amount,
          status: "pending",
        });
      } catch (e) {
        console.error("Failed to create payment:", e);
      }
    }

    // 7. Auto-mark payment as paid when completing
    if (newStatus === "completed") {
      try {
        await supabaseAdmin.from("payments")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("application_id", applicationId);
      } catch (e) {
        console.error("Failed to update payment:", e);
      }
    }

    return new Response(JSON.stringify({ data: updatedApp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
