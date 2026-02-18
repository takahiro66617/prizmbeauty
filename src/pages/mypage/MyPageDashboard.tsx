import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, CheckCircle, Circle, ArrowRight, Megaphone, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);

export default function MyPageDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ applications: 0, pending: 0, completed: 0, earningsCurrentMonth: 0 });
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) setUser(JSON.parse(storedUser));

    const applications = JSON.parse(localStorage.getItem("prizm_applications") || "[]");
    setStats({
      applications: applications.filter((a: any) => a.status === "applied").length,
      pending: applications.filter((a: any) => ["pending_approval", "scouted"].includes(a.status)).length,
      completed: applications.filter((a: any) => a.status === "completed").length,
      earningsCurrentMonth: 0,
    });

    if (applications.length === 0) {
      setTodos([
        { id: "todo-1", text: "プロフィールを充実させて、スカウトを受け取りやすくしましょう！", link: "/mypage/settings", type: "info" },
        { id: "todo-2", text: "気になる案件を探して応募してみましょう", link: "/campaigns", type: "action" },
      ]);
    }
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">おかえりなさい、{user.lastName || ""} {user.firstName || user.name || ""}さん！</h1>
        <p className="text-gray-500 mt-1 flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "応募中の案件", value: `${stats.applications}件`, icon: FileText, color: "text-blue-500" },
          { label: "承認待ち", value: `${stats.pending}件`, icon: Clock, color: "text-yellow-500" },
          { label: "完了案件", value: `${stats.completed}件`, icon: CheckCircle, color: "text-green-500" },
          { label: "今月の報酬", value: `¥${stats.earningsCurrentMonth.toLocaleString()}`, icon: DollarSign, color: "text-pink-500" },
        ].map((s) => (
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
              {todos.length > 0 ? (
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div key={todo.id} className={`flex items-start gap-3 p-3 rounded-lg ${todo.type === "urgent" ? "bg-red-50 border border-red-100" : "bg-white border border-gray-100"}`}>
                      <div className={`mt-0.5 ${todo.type === "urgent" ? "text-red-500" : "text-purple-500"}`}>
                        {todo.type === "urgent" ? <Clock className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{todo.text}</p>
                        {todo.link && (
                          <Link to={todo.link} className="text-xs text-gray-500 hover:text-purple-500 flex items-center mt-1">
                            確認する <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
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
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-pink-500" /> お知らせ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 1, title: "システムメンテナンスのお知らせ", date: "2026.02.10", important: true },
                { id: 2, title: "新機能「スカウト」が追加されました", date: "2026.02.05", important: false },
                { id: 3, title: "利用規約改定のお知らせ", date: "2026.02.01", important: false },
              ].map((news) => (
                <div key={news.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-400">{news.date}</span>
                    {news.important && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">重要</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-700 hover:text-purple-500 cursor-pointer transition-colors line-clamp-2">{news.title}</p>
                </div>
              ))}
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
