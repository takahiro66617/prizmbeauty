import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useLineMessageLogs } from "@/hooks/useLineMessaging";
import { RefreshCw, CheckCircle2, XCircle, Send, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_LABELS: Record<string, { label: string; icon: typeof Send }> = {
  manual: { label: "手動", icon: Send },
  status_change: { label: "自動", icon: Bell },
  reminder: { label: "リマインダー", icon: Bell },
};

export default function LineLogsTab() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: logs = [], isLoading } = useLineMessageLogs({ messageType: typeFilter, logStatus: statusFilter });
  const qc = useQueryClient();

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="all">種別: すべて</option>
          <option value="manual">手動</option>
          <option value="status_change">自動（ステータス変更）</option>
          <option value="reminder">リマインダー</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="all">結果: すべて</option>
          <option value="sent">成功</option>
          <option value="failed">失敗</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["line-message-logs"] })}>
          <RefreshCw className="w-4 h-4 mr-1" />更新
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">読み込み中...</div>
        ) : (logs as any[]).length === 0 ? (
          <div className="text-center py-12 text-gray-400">送信履歴がありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">送信日時</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">送信先</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">種別</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">メッセージ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">結果</th>
                </tr>
              </thead>
              <tbody>
                {(logs as any[]).map((log: any) => {
                  const typeInfo = TYPE_LABELS[log.message_type] || { label: log.message_type, icon: Send };
                  const inf = log.influencer_profiles;
                  return (
                    <tr key={log.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        {inf ? (
                          <div className="flex items-center gap-2">
                            <img src={inf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}&size=24&background=FFD6E8&color=333`}
                              alt="" className="w-6 h-6 rounded-full object-cover" />
                            <span className="text-gray-800 text-xs">{inf.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">{log.line_user_id?.slice(0, 12)}...</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.message_type === "manual" ? "default" : "secondary"} className="text-[10px]">
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 max-w-xs truncate">{log.message_content}</p>
                      </td>
                      <td className="px-4 py-3">
                        {log.status === "sent" ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />成功</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 text-xs" title={log.error_detail || ""}><XCircle className="w-3.5 h-3.5" />失敗</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
