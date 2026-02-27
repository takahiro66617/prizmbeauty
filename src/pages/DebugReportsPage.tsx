import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ExternalLink, Bug } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  open: { label: "未対応", variant: "destructive" },
  in_progress: { label: "対応中", variant: "default" },
  resolved: { label: "解決済", variant: "secondary" },
  wontfix: { label: "対応不要", variant: "outline" },
};

type Report = {
  id: string;
  session_id: string;
  page_url: string;
  user_agent: string | null;
  comment: string | null;
  status: string;
  screenshot_url: string | null;
  error_logs: any[];
  console_logs: any[];
  network_logs: any[];
  interaction_logs: any[];
  user_id: string | null;
  created_at: string;
};

export default function DebugReportsPage() {
  const [filter, setFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["debug-reports"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("debug_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("debug_reports")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["debug-reports"] }),
  });

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bug className="w-6 h-6 text-destructive" />
        <h1 className="text-2xl font-bold">バグレポート管理</h1>
        <Badge variant="secondary">{reports.length}件</Badge>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">すべて ({reports.length})</TabsTrigger>
          {Object.entries(STATUS_MAP).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key}>
              {label} ({reports.filter(r => r.status === key).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">レポートはありません</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <div key={report.id} className="bg-background border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant={STATUS_MAP[report.status]?.variant || "outline"}>
                    {STATUS_MAP[report.status]?.label || report.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(report.created_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={report.status}
                    onValueChange={status => updateStatus.mutate({ id: report.id, status })}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedReport(report)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{report.page_url}</p>
              {report.comment && <p className="text-sm line-clamp-2">{report.comment}</p>}
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>エラー: {(report.error_logs || []).length}</span>
                <span>ネットワーク: {(report.network_logs || []).length}</span>
                <span>操作: {(report.interaction_logs || []).length}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedReport} onOpenChange={open => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>レポート詳細</DialogTitle>
            <DialogDescription>セッションID: {selectedReport?.session_id}</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">日時:</span> {format(new Date(selectedReport.created_at), "yyyy/MM/dd HH:mm:ss", { locale: ja })}</div>
                <div><span className="text-muted-foreground">ステータス:</span> {STATUS_MAP[selectedReport.status]?.label}</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">ページURL:</span>
                <a href={selectedReport.page_url} target="_blank" rel="noreferrer" className="ml-1 text-primary inline-flex items-center gap-1">
                  {selectedReport.page_url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {selectedReport.comment && (
                <div>
                  <Label>コメント</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded mt-1">{selectedReport.comment}</p>
                </div>
              )}

              {selectedReport.screenshot_url && (
                <div>
                  <Label>スクリーンショット</Label>
                  <a href={selectedReport.screenshot_url} target="_blank" rel="noreferrer">
                    <img src={selectedReport.screenshot_url} alt="screenshot" className="max-h-48 rounded border mt-1" />
                  </a>
                </div>
              )}

              <LogSection title="エラーログ" logs={selectedReport.error_logs} />
              <LogSection title="コンソールログ" logs={selectedReport.console_logs} />
              <LogSection title="ネットワークログ" logs={selectedReport.network_logs} />
              <LogSection title="操作ログ" logs={selectedReport.interaction_logs} />

              {selectedReport.user_agent && (
                <div>
                  <Label>User Agent</Label>
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-1 break-all">{selectedReport.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium mb-1">{children}</p>;
}

function LogSection({ title, logs }: { title: string; logs: any[] }) {
  if (!logs || logs.length === 0) return null;
  return (
    <div>
      <Label>{title} ({logs.length}件)</Label>
      <ScrollArea className="max-h-40 border rounded p-2 mt-1">
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(logs, null, 2)}</pre>
      </ScrollArea>
    </div>
  );
}
