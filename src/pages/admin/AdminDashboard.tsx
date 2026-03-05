import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  ArrowRight, Bell, TrendingUp, Users, FileText, FileEdit, Building2, UserCheck, Filter,
  Send, AlertTriangle, CheckCircle, Clock, Wallet, MessageCircle, X,
} from "lucide-react";
import HelpGuideModal from "@/components/admin/HelpGuideModal";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { useExternalInfluencers } from "@/hooks/useExternalInfluencers";
import { useAdminCampaigns, useAdminApplications, useAdminSendNotification } from "@/hooks/useAdminData";
import { APPLICATION_STATUSES, CATEGORIES } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#f97316"];

export default function AdminDashboard() {
  const { data: campaigns = [] } = useAdminCampaigns();
  const { data: companies = [] } = useExternalCompanies();
  const { data: influencers = [] } = useExternalInfluencers();
  const { data: applications = [] } = useAdminApplications();
  const sendNotification = useAdminSendNotification();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Notification sender state
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState<string>("all");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifLink, setNotifLink] = useState("");

  const activeCampaigns = campaigns.filter(c => c.status === "recruiting").length;
  const totalApplicants = applications.length;
  const companyCount = companies.length;
  const influencerCount = influencers.length;
  const pendingApps = applications.filter(a => ["applied", "reviewing"].includes(a.status)).length;
  const pendingInfluencers = influencers.filter(i => i.status === "pending").length;

  // Filtered applications for charts
  const filteredApps = useMemo(() => {
    return applications.filter(a => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || a.campaigns?.category === categoryFilter;
      const matchesDateFrom = !dateFrom || new Date(a.applied_at) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(a.applied_at) <= new Date(dateTo + "T23:59:59");
      return matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [applications, statusFilter, categoryFilter, dateFrom, dateTo]);

  // Monthly data for bar chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; 応募数: number; マッチング数: number }> = {};
    filteredApps.forEach(a => {
      const m = new Date(a.applied_at).toLocaleDateString("ja-JP", { year: "numeric", month: "short" });
      if (!months[m]) months[m] = { month: m, 応募数: 0, マッチング数: 0 };
      months[m].応募数++;
      if (a.status === "approved" || a.status === "in_progress" || a.status === "completed") months[m].マッチング数++;
    });
    return Object.values(months).slice(-6);
  }, [filteredApps]);

  // Status pie chart
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredApps.forEach(a => {
      const label = APPLICATION_STATUSES.find(s => s.id === a.status)?.label || a.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredApps]);

  // ===== Activity feed items =====
  const activityItems = useMemo(() => {
    const items: { id: string; icon: React.ReactNode; color: string; text: string; sub: string; date: Date; link: string; priority: number }[] = [];

    // Pending influencers
    influencers.filter(i => i.status === "pending").forEach(inf => {
      items.push({
        id: "inf-" + inf.id, icon: <UserCheck className="w-4 h-4" />, color: "text-yellow-600 bg-yellow-100",
        text: `IF「${inf.name}」の審査待ち`, sub: "承認または却下してください",
        date: new Date(inf.created_at), link: `/admin/influencers/${inf.id}`, priority: 1,
      });
    });

    // New applications (applied)
    applications.filter(a => a.status === "applied").forEach(app => {
      items.push({
        id: "app-new-" + app.id, icon: <Bell className="w-4 h-4" />, color: "text-blue-600 bg-blue-100",
        text: `「${app.campaigns?.title || "案件"}」に新規応募`, sub: `IF: ${app.influencer_profiles?.name || "不明"}`,
        date: new Date(app.applied_at), link: "/admin/applications", priority: 2,
      });
    });

    // Post submitted - waiting for review
    applications.filter(a => a.status === "post_submitted").forEach(app => {
      items.push({
        id: "app-post-" + app.id, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-600 bg-green-100",
        text: `投稿確認待ち: 「${app.campaigns?.title || "案件"}」`, sub: `IF: ${app.influencer_profiles?.name || "不明"} が投稿を報告`,
        date: new Date(app.updated_at), link: "/admin/applications", priority: 2,
      });
    });

    // Payment pending
    applications.filter(a => a.status === "payment_pending").forEach(app => {
      items.push({
        id: "app-pay-" + app.id, icon: <Wallet className="w-4 h-4" />, color: "text-orange-600 bg-orange-100",
        text: `振込待ち: 「${app.campaigns?.title || "案件"}」`, sub: `IF: ${app.influencer_profiles?.name || "不明"}`,
        date: new Date(app.updated_at), link: "/admin/applications", priority: 3,
      });
    });

    // In progress campaigns
    applications.filter(a => a.status === "in_progress").forEach(app => {
      items.push({
        id: "app-prog-" + app.id, icon: <Clock className="w-4 h-4" />, color: "text-purple-600 bg-purple-100",
        text: `案件進行中: 「${app.campaigns?.title || "案件"}」`, sub: `IF: ${app.influencer_profiles?.name || "不明"} · 投稿待ち`,
        date: new Date(app.updated_at), link: "/admin/applications", priority: 4,
      });
    });

    // Pending approval campaigns
    campaigns.filter(c => c.status === "pending_approval").forEach(c => {
      items.push({
        id: "camp-pending-" + c.id, icon: <FileText className="w-4 h-4" />, color: "text-amber-600 bg-amber-100",
        text: `案件承認待ち: 「${c.title}」`, sub: `企業: ${c.companies?.name || "不明"}`,
        date: new Date(c.created_at), link: "/admin/campaigns", priority: 1,
      });
    });

    // Campaigns with deadline approaching (within 3 days)
    const now = Date.now();
    campaigns.filter(c => c.status === "recruiting" && c.deadline).forEach(c => {
      const diff = new Date(c.deadline!).getTime() - now;
      if (diff > 0 && diff < 3 * 24 * 60 * 60 * 1000) {
        items.push({
          id: "camp-deadline-" + c.id, icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-600 bg-red-100",
          text: `締切間近: 「${c.title}」`, sub: `締切: ${new Date(c.deadline!).toLocaleDateString("ja-JP")}`,
          date: new Date(c.deadline!), link: "/admin/campaigns", priority: 1,
        });
      }
    });

    // Sort by priority then date
    items.sort((a, b) => a.priority - b.priority || b.date.getTime() - a.date.getTime());
    return items;
  }, [influencers, applications, campaigns]);

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("タイトルと本文を入力してください");
      return;
    }
    sendNotification.mutate({
      targetType: notifTarget as any,
      title: notifTitle,
      message: notifMessage,
      type: "info",
      link: notifLink || undefined,
    }, {
      onSuccess: (data: any) => {
        toast.success(`${data?.sent || 0}名に通知を送信しました`);
        setShowNotifModal(false);
        setNotifTitle("");
        setNotifMessage("");
        setNotifLink("");
      },
      onError: () => toast.error("送信に失敗しました"),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">事務局管理画面へようこそ。全体の状況を確認しましょう。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNotifModal(true)}>
            <Send className="w-4 h-4 mr-2" />通知を送信
          </Button>
          <HelpGuideModal
            title="ダッシュボードの使い方"
            description="ダッシュボードでは、プラットフォーム全体の状況をリアルタイムで把握できます。"
            sections={[
              { title: "統計カード", content: ["総応募数・稼働中案件数・企業数・IF数を一目で確認", "各カードをクリックすると詳細ページへ移動"] },
              { title: "統計分析", content: ["ステータス・カテゴリ・期間でフィルタリング可能", "月別応募推移とステータス別円グラフで分析"] },
              { title: "アクティビティ", content: ["審査待ち・投稿確認待ち・振込待ち等の進捗を確認", "優先度順に表示、クリックで該当ページへ移動"] },
              { title: "通知送信", content: ["インフルエンサー・企業に一括または個別で通知を送信", "「通知を送信」ボタンから送信フォームを開く"] },
            ]}
            workflow={[
              "審査待ちインフルエンサーの承認・却下を処理",
              "承認待ち案件の内容を確認し承認・却下",
              "新規応募のマッチングを確認",
              "案件スレッドで進行状況をモニタリング",
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/applications" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">総応募数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalApplicants}<span className="text-sm font-normal text-gray-400 ml-1">件</span></h3>
                <p className="text-xs text-green-600 mt-1">選考中: {pendingApps}件</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full text-pink-500"><TrendingUp className="w-6 h-6" /></div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/campaigns" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">稼働中案件数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{activeCampaigns}<span className="text-sm font-normal text-gray-400 ml-1">件</span></h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full text-purple-500"><FileText className="w-6 h-6" /></div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/clients" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">登録企業数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{companyCount}<span className="text-sm font-normal text-gray-400 ml-1">社</span></h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-500"><Building2 className="w-6 h-6" /></div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/influencers" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">登録インフルエンサー数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{influencerCount}<span className="text-sm font-normal text-gray-400 ml-1">名</span></h3>
                {pendingInfluencers > 0 && <p className="text-xs text-yellow-600 mt-1">審査待ち: {pendingInfluencers}名</p>}
              </div>
              <div className="p-3 bg-green-100 rounded-full text-green-500"><Users className="w-6 h-6" /></div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Charts Section */}
      <Card className="p-6 border-0 shadow-lg bg-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Filter className="w-5 h-5 text-purple-500" />統計分析</h2>
          <div className="flex gap-2 flex-wrap items-center text-sm">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 rounded border border-gray-200 text-sm">
              <option value="all">ステータス: すべて</option>
              {APPLICATION_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-2 py-1.5 rounded border border-gray-200 text-sm">
              <option value="all">カテゴリ: すべて</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-200 text-sm" />
            <span className="text-gray-400">〜</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-200 text-sm" />
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setDateFrom(""); setDateTo(""); }}>リセット</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">月別応募数・マッチング数</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="応募数" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="マッチング数" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">ステータス別割合</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400">データなし</div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">絞り込み結果: {filteredApps.length}件</p>
      </Card>

      {/* Activity Feed + 3-Panel Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - full width */}
        <Card className="p-6 border-0 shadow-lg bg-white lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />アクティビティ・進捗
            </h2>
            <Badge variant="outline" className="text-xs">{activityItems.length}件</Badge>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {activityItems.length > 0 ? activityItems.slice(0, 20).map(item => (
              <Link key={item.id} to={item.link} className="block">
                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 mt-1">{item.date.toLocaleDateString("ja-JP")}</span>
                </div>
              </Link>
            )) : (
              <p className="text-center text-gray-400 py-8">現在対応が必要なタスクはありません 🎉</p>
            )}
          </div>
        </Card>

        {/* IF Progress Panel */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg"><Users className="w-5 h-5 text-pink-600" /></div>
            <h2 className="text-base font-bold text-gray-800">インフルエンサー進捗</h2>
          </div>
          <div className="space-y-3">
            {(() => {
              const ifItems = [
                { label: "審査待ち", count: pendingInfluencers, color: "bg-yellow-500", ring: "ring-yellow-200" },
                { label: "新規応募", count: applications.filter(a => a.status === "applied").length, color: "bg-blue-500", ring: "ring-blue-200" },
                { label: "選考中", count: applications.filter(a => a.status === "reviewing").length, color: "bg-indigo-500", ring: "ring-indigo-200" },
                { label: "採用済み", count: applications.filter(a => a.status === "approved").length, color: "bg-green-500", ring: "ring-green-200" },
                { label: "案件進行中", count: applications.filter(a => a.status === "in_progress").length, color: "bg-purple-500", ring: "ring-purple-200" },
                { label: "投稿済み", count: applications.filter(a => a.status === "post_submitted").length, color: "bg-teal-500", ring: "ring-teal-200" },
                { label: "修正依頼中", count: applications.filter(a => a.status === "revision_requested").length, color: "bg-amber-500", ring: "ring-amber-200" },
              ];
              const total = ifItems.reduce((s, i) => s + i.count, 0) || 1;
              return ifItems.map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.count > 0 ? "text-gray-900" : "text-gray-300"}`}>{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${(item.count / total) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
          <Link to="/admin/influencers" className="block mt-4">
            <Button variant="ghost" size="sm" className="w-full text-pink-600 hover:bg-pink-100 text-xs">IF管理へ <ArrowRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        </Card>

        {/* Company Progress Panel */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg"><Building2 className="w-5 h-5 text-blue-600" /></div>
            <h2 className="text-base font-bold text-gray-800">企業側 進捗</h2>
          </div>
          <div className="space-y-3">
            {(() => {
              const pendingApproval = campaigns.filter(c => c.status === "pending_approval").length;
              const recruiting = campaigns.filter(c => c.status === "recruiting").length;
              const closed = campaigns.filter(c => c.status === "closed").length;
              const deadlineSoon = campaigns.filter(c => c.status === "recruiting" && c.deadline && (new Date(c.deadline).getTime() - Date.now()) < 3 * 86400000 && (new Date(c.deadline).getTime() - Date.now()) > 0).length;
              const postConfirmed = applications.filter(a => a.status === "post_confirmed").length;
              const paymentPending = applications.filter(a => a.status === "payment_pending").length;
              const compItems = [
                { label: "案件承認待ち", count: pendingApproval, color: "bg-yellow-500" },
                { label: "募集中", count: recruiting, color: "bg-emerald-500" },
                { label: "締切間近（3日以内）", count: deadlineSoon, color: "bg-red-500" },
                { label: "募集終了", count: closed, color: "bg-gray-500" },
                { label: "投稿確認済み", count: postConfirmed, color: "bg-teal-500" },
                { label: "振込待ち", count: paymentPending, color: "bg-orange-500" },
              ];
              const total = compItems.reduce((s, i) => s + i.count, 0) || 1;
              return compItems.map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.count > 0 ? "text-gray-900" : "text-gray-300"}`}>{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${(item.count / total) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
          <Link to="/admin/campaigns" className="block mt-4">
            <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:bg-blue-100 text-xs">案件管理へ <ArrowRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        </Card>

        {/* Admin/Platform Progress Panel */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <h2 className="text-base font-bold text-gray-800">全体サマリー</h2>
          </div>
          <div className="space-y-3">
            {(() => {
              const completed = applications.filter(a => a.status === "completed").length;
              const rejected = applications.filter(a => a.status === "rejected").length;
              const totalApps = applications.length;
              const matchRate = totalApps > 0 ? Math.round(((totalApps - rejected) / totalApps) * 100) : 0;
              const summaryItems = [
                { label: "総応募数", count: totalApps, color: "bg-blue-500" },
                { label: "マッチング率", count: matchRate, suffix: "%", color: "bg-green-500" },
                { label: "完了案件", count: completed, color: "bg-gray-500" },
                { label: "不採用", count: rejected, color: "bg-red-500" },
                { label: "登録IF数", count: influencerCount, color: "bg-pink-500" },
                { label: "登録企業数", count: companyCount, color: "bg-indigo-500" },
              ];
              return summaryItems.map(item => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {item.count}{(item as any).suffix || ""}
                  </span>
                </div>
              ));
            })()}
          </div>
          <Link to="/admin/applications" className="block mt-4">
            <Button variant="ghost" size="sm" className="w-full text-purple-600 hover:bg-purple-100 text-xs">応募管理へ <ArrowRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        </Card>
      </div>

      {/* Notification Send Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowNotifModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2"><Send className="w-5 h-5 text-blue-600" />お知らせ通知を送信</h3>
              <button onClick={() => setShowNotifModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">送信対象</label>
                <select value={notifTarget} onChange={e => setNotifTarget(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="all">全員（IF＋企業）</option>
                  <option value="all_influencers">全インフルエンサー</option>
                  <option value="all_companies">全企業</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="例: メンテナンスのお知らせ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
                <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="通知の内容を入力..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[120px]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">リンク（任意）</label>
                <Input value={notifLink} onChange={e => setNotifLink(e.target.value)} placeholder="例: /campaigns" />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNotifModal(false)}>キャンセル</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSendNotification} disabled={sendNotification.isPending}>
                <Send className="w-4 h-4 mr-2" />{sendNotification.isPending ? "送信中..." : "送信する"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
