import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function MyPageNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setNotifications(data || []);
    };
    load();
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "scout": case "application": return <Badge className="bg-pink-100 text-pink-700 text-[10px]">案件</Badge>;
      case "info": return <Badge className="bg-blue-100 text-blue-700 text-[10px]">お知らせ</Badge>;
      case "success": return <Badge className="bg-green-100 text-green-700 text-[10px]">成功</Badge>;
      case "warning": return <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">注意</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700 text-[10px]">システム</Badge>;
    }
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">お知らせ</h1>
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div key={notif.id}
              className={`bg-white p-6 rounded-xl border shadow-sm cursor-pointer ${!notif.read ? "border-pink-200 bg-pink-50/30" : "border-gray-100"}`}
              onClick={() => !notif.read && markRead(notif.id)}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {getTypeBadge(notif.type)}
                  <h3 className="font-bold text-gray-800">{notif.title}</h3>
                  {!notif.read && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">新着</span>}
                </div>
                <span className="text-sm text-gray-400 shrink-0 ml-4">{new Date(notif.created_at).toLocaleDateString("ja-JP")}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">お知らせはありません</div>
      )}
    </div>
  );
}
