import { Badge } from "@/components/ui/badge";
import { getMessagesForUser, getApplicationsForInfluencer, getCampaignById, getCompanyById, MOCK_USER } from "@/lib/mockData";

export default function MyPageNotifications() {
  const userId = JSON.parse(sessionStorage.getItem("currentUser") || "null")?.id || MOCK_USER.id;
  const messages = getMessagesForUser(userId).filter(m => m.receiverId === userId);
  const applications = getApplicationsForInfluencer(userId);

  // Build notifications from messages + application status changes
  const notifications: { id: string; title: string; content: string; date: string; type: "message" | "application" | "system"; read: boolean }[] = [];

  messages.forEach(msg => {
    notifications.push({
      id: msg.id,
      title: msg.subject,
      content: msg.content.substring(0, 100) + "...",
      date: msg.createdAt,
      type: msg.subject.includes("スカウト") ? "application" : "message",
      read: msg.read,
    });
  });

  applications.filter(a => a.reviewedAt).forEach(app => {
    const campaign = getCampaignById(app.campaignId);
    const statusText = app.status === "approved" ? "採用されました" : app.status === "rejected" ? "不採用となりました" : "";
    if (statusText && campaign) {
      notifications.push({
        id: `notif-${app.id}`,
        title: `「${campaign.title}」の選考結果`,
        content: `${statusText}${app.reviewComment ? ` - ${app.reviewComment}` : ""}`,
        date: app.reviewedAt!,
        type: "application",
        read: true,
      });
    }
  });

  // System notifications
  notifications.push(
    { id: "sys-1", title: "システムメンテナンスのお知らせ", content: "2026年2月15日(木) AM 2:00〜4:00 の間、システムメンテナンスを実施いたします。", date: "2026-02-10", type: "system", read: true },
    { id: "sys-2", title: "新機能「スカウト」が追加されました", content: "企業から直接オファーが届く「スカウト機能」がリリースされました。", date: "2026-02-05", type: "system", read: true },
  );

  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "message": return <Badge className="bg-blue-100 text-blue-700 text-[10px]">メッセージ</Badge>;
      case "application": return <Badge className="bg-pink-100 text-pink-700 text-[10px]">案件</Badge>;
      case "system": return <Badge className="bg-gray-100 text-gray-700 text-[10px]">システム</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">お知らせ</h1>
      <div className="space-y-4">
        {notifications.map(notif => (
          <div key={notif.id} className={`bg-white p-6 rounded-xl border shadow-sm ${!notif.read ? "border-pink-200 bg-pink-50/30" : "border-gray-100"}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {getTypeBadge(notif.type)}
                <h3 className="font-bold text-gray-800">{notif.title}</h3>
                {!notif.read && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">新着</span>}
              </div>
              <span className="text-sm text-gray-400 shrink-0 ml-4">{new Date(notif.date).toLocaleDateString("ja-JP")}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{notif.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
