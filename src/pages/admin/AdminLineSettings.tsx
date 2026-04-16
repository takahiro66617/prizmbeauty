import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSetting, useAdminUpdateAppSetting } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, EyeOff, MessageCircle, Shield } from "lucide-react";

export default function AdminLineSettings() {
  const navigate = useNavigate();
  const { data: lineData, isLoading } = useAppSetting("line_messaging_config");
  const updateSetting = useAdminUpdateAppSetting();

  const [form, setForm] = useState({
    channel_access_token: "",
    channel_secret: "",
  });
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (lineData && typeof lineData === "object") {
      setForm(prev => ({ ...prev, ...(lineData as any) }));
    }
  }, [lineData]);

  const handleSave = () => {
    if (!form.channel_access_token.trim()) {
      toast.error("チャネルアクセストークンを入力してください");
      return;
    }
    updateSetting.mutate({ key: "line_messaging_config", value: form }, {
      onSuccess: () => toast.success("LINE設定を保存しました"),
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  const maskValue = (val: string) => {
    if (!val || val.length < 8) return "••••••••";
    return val.substring(0, 4) + "••••••••" + val.substring(val.length - 4);
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")} className="text-gray-500">
        <ArrowLeft className="w-4 h-4 mr-1" />ダッシュボードに戻る
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-green-500" />
          LINE Messaging API 設定
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          インフルエンサーへのLINE通知送信に使用する認証情報を設定します。
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-700">
          <p className="font-medium mb-1">セキュリティに関する注意</p>
          <p>これらの認証情報はデータベースに暗号化せずに保存されます。管理者のみがアクセスできますが、トークンの取り扱いには十分ご注意ください。</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">チャネルアクセストークン（長期）</label>
          <p className="text-xs text-gray-400 mb-2">LINE Developers → Messaging API設定 → チャネルアクセストークン（長期）</p>
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={form.channel_access_token}
              onChange={e => setForm({ ...form, channel_access_token: e.target.value })}
              placeholder="チャネルアクセストークンを入力"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">チャネルシークレット（任意）</label>
          <p className="text-xs text-gray-400 mb-2">Webhook検証に使用します。Phase 2以降で必要になります。</p>
          <div className="relative">
            <Input
              type={showSecret ? "text" : "password"}
              value={form.channel_secret}
              onChange={e => setForm({ ...form, channel_secret: e.target.value })}
              placeholder="チャネルシークレットを入力（任意）"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={updateSetting.isPending}>
            <Save className="w-4 h-4 mr-2" />保存
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-3">
        <h3 className="font-medium text-gray-700 text-sm">設定手順</h3>
        <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
          <li><a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">LINE Developers Console</a> にアクセス</li>
          <li>Messaging API チャネルを選択（またはプロバイダー内に新規作成）</li>
          <li>「Messaging API設定」タブ →「チャネルアクセストークン（長期）」を発行</li>
          <li>発行されたトークンをこの画面に貼り付けて保存</li>
        </ol>
        <p className="text-xs text-gray-400 mt-2">
          ※ LINE Loginチャネルと同じプロバイダー内にMessaging APIチャネルを作成すると、line_user_idの互換性が確保されます。
        </p>
      </div>
    </div>
  );
}
