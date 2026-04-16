import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAppSetting, useAdminUpdateAppSetting } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { Save, Info } from "lucide-react";

interface StatusConfig {
  enabled: boolean;
  template: string;
}

const STATUS_ITEMS = [
  { key: "approved", label: "🎉 採用", emoji: "🎉", defaultTemplate: "【PRizm】🎉 採用されました\n\n案件名：{案件名}\n\n詳しくはマイページをご確認ください。\nhttps://app.pr-izm.com/mypage/applications" },
  { key: "rejected", label: "❌ 見送り", emoji: "❌", defaultTemplate: "【PRizm】応募が見送りとなりました\n\n案件名：{案件名}\n\nまた別の案件にぜひご応募ください。\nhttps://app.pr-izm.com/mypage/campaigns" },
  { key: "post_confirmed", label: "✅ 投稿承認", emoji: "✅", defaultTemplate: "【PRizm】✅ 投稿が承認されました\n\n案件名：{案件名}\n\n詳しくはマイページをご確認ください。\nhttps://app.pr-izm.com/mypage/applications" },
  { key: "payment_pending", label: "💰 支払い手続き", emoji: "💰", defaultTemplate: "【PRizm】💰 報酬の支払い手続き中です\n\n案件名：{案件名}\n\n詳しくはマイページをご確認ください。\nhttps://app.pr-izm.com/mypage/rewards" },
  { key: "completed", label: "🎊 案件完了", emoji: "🎊", defaultTemplate: "【PRizm】🎊 案件が完了しました\n\n案件名：{案件名}\n\nご協力ありがとうございました！\nhttps://app.pr-izm.com/mypage/applications" },
];

export default function LineAutoNotificationTab() {
  const { data: savedConfig, isLoading } = useAppSetting("line_auto_notifications");
  const updateSetting = useAdminUpdateAppSetting();

  const [config, setConfig] = useState<Record<string, StatusConfig>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    if (savedConfig && typeof savedConfig === "object") {
      // Merge saved with defaults
      const merged: Record<string, StatusConfig> = {};
      for (const item of STATUS_ITEMS) {
        const saved = (savedConfig as any)[item.key];
        merged[item.key] = {
          enabled: saved?.enabled !== false,
          template: saved?.template || item.defaultTemplate,
        };
      }
      setConfig(merged);
    } else {
      // Initialize defaults
      const defaults: Record<string, StatusConfig> = {};
      for (const item of STATUS_ITEMS) {
        defaults[item.key] = { enabled: true, template: item.defaultTemplate };
      }
      setConfig(defaults);
    }
  }, [savedConfig]);

  const toggleEnabled = (key: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key]?.enabled },
    }));
  };

  const updateTemplate = (key: string, template: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], template },
    }));
  };

  const resetTemplate = (key: string) => {
    const item = STATUS_ITEMS.find(i => i.key === key);
    if (item) updateTemplate(key, item.defaultTemplate);
  };

  const handleSave = () => {
    updateSetting.mutate({ key: "line_auto_notifications", value: config }, {
      onSuccess: () => toast.success("自動通知設定を保存しました"),
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>;

  return (
    <div className="space-y-4 mt-4 max-w-3xl">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">自動通知について</p>
          <p>応募のステータスが変更された際に、インフルエンサーのLINEへ自動的に通知メッセージを送信します。各ステータスごとにON/OFFの切り替えとメッセージテンプレートのカスタマイズが可能です。</p>
          <p className="mt-1 text-xs">利用可能な変数: <code className="bg-blue-100 px-1 rounded">{"{案件名}"}</code> <code className="bg-blue-100 px-1 rounded">{"{インフルエンサー名}"}</code></p>
        </div>
      </div>

      <div className="space-y-3">
        {STATUS_ITEMS.map(item => {
          const c = config[item.key] || { enabled: true, template: item.defaultTemplate };
          const isEditing = editingKey === item.key;
          return (
            <div key={item.key} className={`bg-white rounded-2xl border shadow-sm transition-all ${c.enabled ? "border-green-200" : "border-gray-200 opacity-70"}`}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400">{c.enabled ? "有効" : "無効"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditingKey(isEditing ? null : item.key)}>
                    {isEditing ? "閉じる" : "テンプレート編集"}
                  </Button>
                  <Switch checked={c.enabled} onCheckedChange={() => toggleEnabled(item.key)} />
                </div>
              </div>
              {isEditing && (
                <div className="px-4 pb-4 space-y-2 border-t pt-3">
                  <Textarea value={c.template} onChange={e => updateTemplate(item.key, e.target.value)} rows={5} className="text-sm" />
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => resetTemplate(item.key)}>デフォルトに戻す</Button>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex-1 ml-3">
                      <p className="text-xs font-medium text-green-700 mb-1">プレビュー</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">
                        {c.template.replace("{案件名}", "美容モニター案件").replace("{インフルエンサー名}", "池田 耀")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={updateSetting.isPending}>
          <Save className="w-4 h-4 mr-2" />設定を保存
        </Button>
      </div>
    </div>
  );
}
