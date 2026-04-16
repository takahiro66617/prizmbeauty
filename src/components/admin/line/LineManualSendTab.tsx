import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useExternalInfluencers } from "@/hooks/useExternalInfluencers";
import { useLineBulkSend } from "@/hooks/useLineMessaging";
import { GENRES, INFLUENCER_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import { Send, Search, Users, Loader2, CheckSquare, Square } from "lucide-react";

const MESSAGE_TEMPLATES = [
  { label: "テンプレートを選択...", value: "" },
  { label: "📢 お知らせ", value: "【PRizm】お知らせ\n\n{内容}\n\n詳しくはマイページをご確認ください。\nhttps://app.pr-izm.com/mypage" },
  { label: "📋 新着案件のご案内", value: "【PRizm】新着案件のご案内\n\n新しい案件が公開されました！\n\nぜひマイページからご確認ください。\nhttps://app.pr-izm.com/mypage/campaigns" },
  { label: "⏰ リマインダー", value: "【PRizm】リマインダー\n\n{内容}\n\nご不明な点がございましたらお気軽にお問い合わせください。" },
  { label: "🎉 ご挨拶", value: "【PRizm】こんにちは！\n\nPRizmをご利用いただきありがとうございます。\n\n{内容}" },
];

export default function LineManualSendTab() {
  const { data: influencers = [], isLoading } = useExternalInfluencers();
  const bulkSend = useLineBulkSend();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  // Only LINE-connected influencers
  const lineInfluencers = useMemo(() => {
    return influencers.filter(i => !!i.line_user_id);
  }, [influencers]);

  const filtered = useMemo(() => {
    return lineInfluencers.filter(i => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (genreFilter !== "all" && !(i.category || "").includes(genreFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!i.name.toLowerCase().includes(s) && !i.username.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [lineInfluencers, statusFilter, genreFilter, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const handleSend = () => {
    if (!message.trim() || selectedIds.size === 0) return;
    const targets = filtered
      .filter(i => selectedIds.has(i.id))
      .map(i => ({ line_user_id: i.line_user_id!, influencer_id: i.id }));

    if (!window.confirm(`${targets.length}名にLINEメッセージを送信します。よろしいですか？`)) return;

    bulkSend.mutate({ targets, message: message.trim() }, {
      onSuccess: (data) => {
        toast.success(`送信完了: 成功 ${data.sent}件 / 失敗 ${data.failed}件`);
        if (data.failed > 0) toast.error(`失敗詳細: ${data.errors?.join(", ")}`);
        setSelectedIds(new Set());
      },
      onError: (e) => toast.error(`送信失敗: ${e.message}`),
    });
  };

  const handleTemplateSelect = (val: string) => {
    if (val) setMessage(val);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="font-medium text-gray-700 text-sm flex items-center gap-2"><Search className="w-4 h-4" />送信対象の絞り込み</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="名前・ユーザー名で検索" value={search} onChange={e => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="all">ステータス: すべて</option>
            {INFLUENCER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="all">ジャンル: すべて</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400">※ LINE連携済みのインフルエンサーのみ表示されます（{lineInfluencers.length}名中 {filtered.length}名該当）</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Target list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />送信対象者
              <Badge variant="secondary" className="ml-1">{selectedIds.size}名選択</Badge>
            </h3>
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
              {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-3.5 h-3.5 mr-1" /> : <Square className="w-3.5 h-3.5 mr-1" />}
              {selectedIds.size === filtered.length && filtered.length > 0 ? "全解除" : "全選択"}
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {isLoading ? (
              <p className="text-center py-4 text-gray-400 text-sm">読み込み中...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-sm">該当するインフルエンサーがいません</p>
            ) : (
              filtered.map(inf => {
                const checked = selectedIds.has(inf.id);
                const st = INFLUENCER_STATUSES.find(s => s.id === inf.status);
                return (
                  <div key={inf.id} onClick={() => toggleSelect(inf.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${checked ? "bg-green-50 border border-green-200" : "hover:bg-gray-50 border border-transparent"}`}>
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <img src={inf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}&size=32&background=FFD6E8&color=333`}
                      alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{inf.name}</p>
                      <p className="text-xs text-gray-400">@{inf.username}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{st?.label || inf.status}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message compose */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h3 className="font-medium text-gray-700 text-sm flex items-center gap-2"><Send className="w-4 h-4" />メッセージ作成</h3>
          <select onChange={e => handleTemplateSelect(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            {MESSAGE_TEMPLATES.map((t, i) => <option key={i} value={t.value}>{t.label}</option>)}
          </select>
          <Textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="送信するメッセージを入力してください..." rows={8} className="resize-none" />
          <p className="text-xs text-gray-400">文字数: {message.length}</p>

          {/* Preview */}
          {message && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-xs font-medium text-green-700 mb-2">📱 プレビュー</p>
              <div className="bg-white rounded-lg p-3 shadow-sm text-sm whitespace-pre-wrap text-gray-800">{message}</div>
            </div>
          )}

          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSend}
            disabled={bulkSend.isPending || selectedIds.size === 0 || !message.trim()}>
            {bulkSend.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {selectedIds.size > 0 ? `${selectedIds.size}名に送信` : "送信対象を選択してください"}
          </Button>
        </div>
      </div>
    </div>
  );
}
