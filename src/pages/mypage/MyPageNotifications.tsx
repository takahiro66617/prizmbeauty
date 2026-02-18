import { Badge } from "@/components/ui/badge";
import { useExternalNotifications } from "@/hooks/useExternalNotifications";
import { useExternalApplications } from "@/hooks/useExternalApplications";

export default function MyPageNotifications() {
  const userId = JSON.parse(sessionStorage.getItem("currentUser") || "null")?.id || "";
  const { data: dbNotifications = [], isLoading } = useExternalNotifications(userId);
  const { data: applications = [] } = useExternalApplications({ influencerId: userId });

  // Build notifications from DB notifications + application status changes
  const notifications: { id: string; title: string; content: string; date: string; type: "message" | "application" | "system"; read: boolean }[] = [];

  dbNotifications.forEach(n => {
    notifications.push({
      id: n.id,
      title: n.title,
      content: n.message,
      date: n.created_at,
      type: n.type === "message" ? "message" : n.type === "application" ? "application" : "system",
      read: n.read,
    });
  });

  applications.filter(a => a.status === "approved" || a.status === "rejected").forEach(app => {
    const statusText = app.status === "approved" ? "採用されました" : "不採用となりました";
    notifications.push({
      id: `notif-${app.id}`,
      title: `「${app.campaigns?.title || "案件"}」の選考結果`,
      content: statusText,
      date: app.updated_at,
      type: "application",
      read: true,
    });
  });

  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "message": return <Badge className="bg-blue-100 text-blue-700 text-[10px]">メッセージ</Badge>;
      case "application": return <Badge className="bg-pink-100 text-pink-700 text-[10px]">案件</Badge>;
      case "system": return <Badge className="bg-gray-100 text-gray-700 text-[10px]">システム</Badge>;
      default: return null;
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">お知らせ</h1>
      <div className="space-y-4">
        {notifications.length > 0 ? notifications.map(notif => (
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
        )) : (
          <div className="text-center py-12 text-gray-500">お知らせはありません</div>
        )}
      </div>
    </div>
  );
}
