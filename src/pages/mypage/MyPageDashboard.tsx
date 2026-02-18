import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, CheckCircle, Circle, ArrowRight, Megaphone, Calendar, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);

export default function MyPageDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ applications: 0, approved: 0, completed: 0, messages: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const { data: inf } = await supabase.from("influencer_profiles").select("*").eq("user_id", uid).maybeSingle();
      setProfile(inf);
      if (!inf) return;

      const [appRes, msgRes, notifRes] = await Promise.all([
        supabase.from("applications").select("id, status, campaign_id, campaigns(title)").eq("influencer_id", inf.id),
        supabase.from("messages").select("id").eq("receiver_id", uid).eq("read", false),
        supabase.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
      ]);

      const apps = appRes.data || [];
      setStats({
        applications: apps.filter(a => ["applied", "reviewing"].includes(a.status)).length,
        approved: apps.filter(a => a.status === "approved").length,
        completed: apps.filter(a => a.status === "completed").length,
        messages: (msgRes.data || []).length,
      });
      setNotifications(notifRes.data || []);
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">おかえりなさい、{profile?.name || ""}さん！</h1>
        <p className="text-gray-500 mt-1 flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "選考中の案件", value: `${stats.applications}件`, icon: FileText, color: "text-blue-500" },
          { label: "採用済み", value: `${stats.approved}件`, icon: CheckCircle, color: "text-green-500" },
          { label: "完了案件", value: `${stats.completed}件`, icon: Clock, color: "text-yellow-500" },
          { label: "未読メッセージ", value: `${stats.messages}件`, icon: MessageCircle, color: "text-pink-500" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg">次のアクション (TODO)</CardTitle></CardHeader>
            <CardContent>
              {stats.applications === 0 && stats.approved === 0 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                    <Circle className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">気になる案件を探して応募してみましょう</p>
                      <Link to="/campaigns" className="text-xs text-gray-500 hover:text-purple-500 flex items-center mt-1">確認する <ArrowRight className="w-3 h-3 ml-1" /></Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">現在のアクションはありません</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2"><Megaphone className="w-5 h-5 text-pink-500" />お知らせ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString("ja-JP")}</span>
                    {!n.read && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">新着</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-700 line-clamp-2">{n.title}</p>
                </div>
              )) : (
                <p className="text-center text-gray-400 py-4 text-sm">お知らせはありません</p>
              )}
              <Link to="/mypage/notifications" className="w-full block">
                <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 hover:text-purple-500">すべて見る</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
