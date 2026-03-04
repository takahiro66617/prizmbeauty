import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, ChevronRight, QrCode, ExternalLink } from "lucide-react";
import logoImg from "@/assets/logo.png";

const LINE_FRIEND_ADD_URL = "https://line.me/R/ti/p/@616jfxwh";
const LINE_QR_URL = "https://qr-official.line.me/sid/M/616jfxwh.png";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
}

export default function LineAddFriend() {
  const navigate = useNavigate();
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [hasClickedAdd, setHasClickedAdd] = useState(false);
  const [returnedFromLine, setReturnedFromLine] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("lineProfile");
    if (!stored) {
      navigate("/auth/login");
      return;
    }
    setLineProfile(JSON.parse(stored));
  }, [navigate]);

  // Page Visibility API — detect when user returns from LINE app
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible" && hasClickedAdd) {
      setReturnedFromLine(true);
    }
  }, [hasClickedAdd]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Also detect focus (backup for some browsers)
  useEffect(() => {
    const handleFocus = () => {
      if (hasClickedAdd) {
        setReturnedFromLine(true);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [hasClickedAdd]);

  const handleAddFriendClick = () => {
    setHasClickedAdd(true);
  };

  const handleNext = () => {
    sessionStorage.setItem("lineFriendAdded", "true");
    navigate("/auth/register/profile");
  };

  if (!lineProfile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06C755]/10 via-card to-pastel-pink/20 py-8 px-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold gradient-text">友だち追加</h1>
          <p className="text-muted-foreground text-sm">
            PRizmの公式LINEアカウントを<br />友だち追加してください
          </p>
        </div>

        <Card className="p-6 shadow-xl border-0 bg-card/90 backdrop-blur-sm rounded-2xl space-y-6">
          {/* LINE Profile */}
          {lineProfile.pictureUrl && (
            <div className="flex justify-center">
              <img
                src={lineProfile.pictureUrl}
                alt="プロフィール"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#06C755]/30"
              />
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground">
            ようこそ、<span className="font-semibold text-foreground">{lineProfile.displayName}</span> さん
          </p>

          {/* Official Account Info */}
          <div className="bg-[#06C755]/5 border border-[#06C755]/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-[#06C755]/30 bg-white flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={logoImg}
                  alt="PRizm公式アカウント"
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML =
                        '<span style="font-size:1.25rem;font-weight:700;color:#06C755">P</span>';
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base">PRizm（プリズム）</p>
                <p className="text-xs text-muted-foreground">LINE公式アカウント</p>
                <p className="text-xs text-muted-foreground font-mono">@616jfxwh</p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-foreground font-medium">友だち追加が必要な理由</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>案件の採用通知やリマインドをLINEでお届けします</li>
              <li>重要な連絡を見逃さないために必要です</li>
            </ul>
          </div>

          {/* ============ NOT YET RETURNED FROM LINE ============ */}
          {!returnedFromLine && (
            <div className="space-y-3">
              {/* Primary: Open LINE to add friend */}
              <a
                href={LINE_FRIEND_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAddFriendClick}
                className="flex items-center justify-center w-full h-12 text-base font-bold bg-[#06C755] hover:bg-[#05B04C] text-white rounded-full gap-2 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                友だち追加する
              </a>

              {/* Secondary: QR code toggle — no navigation needed */}
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="flex items-center justify-center w-full gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <QrCode className="w-4 h-4" />
                {showQr ? "QRコードを閉じる" : "QRコードで追加する（画面遷移なし）"}
              </button>

              {/* QR Code display */}
              {showQr && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <img
                        src={LINE_QR_URL}
                        alt="LINE友だち追加QRコード"
                        className="w-48 h-48"
                        onError={(e) => {
                          // Fallback: use generic QR API
                          e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(LINE_FRIEND_ADD_URL)}`;
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    LINEアプリのQRコードリーダーで<br />スキャンしてください
                  </p>
                  {/* After showing QR, let user proceed with confirmation */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="confirm-qr"
                        checked={confirmed}
                        onCheckedChange={(v) => setConfirmed(v === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="confirm-qr" className="text-sm text-foreground cursor-pointer leading-snug">
                        上記アカウントを友だち追加しました
                      </label>
                    </div>
                    <Button
                      onClick={handleNext}
                      variant="gradient"
                      className="w-full h-12 text-base font-bold"
                      disabled={!confirmed}
                    >
                      次へ進む
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Waiting indicator — shown after clicking add friend link */}
              {hasClickedAdd && !showQr && (
                <div className="text-center space-y-2 animate-in fade-in duration-300 py-2">
                  <div className="w-6 h-6 border-[3px] border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    友だち追加後、このページに戻ると<br />
                    <span className="font-semibold text-foreground">自動的に次のステップへ進めます</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============ RETURNED FROM LINE — auto-detected ============ */}
          {returnedFromLine && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#06C755]/10 border border-[#06C755]/30 rounded-xl p-4 text-center">
                <p className="text-sm font-medium text-[#06C755]">
                  ✓ LINEから戻りました
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="confirm-added"
                  checked={confirmed}
                  onCheckedChange={(v) => setConfirmed(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="confirm-added" className="text-sm text-foreground cursor-pointer leading-snug">
                  上記アカウントを友だち追加しました
                </label>
              </div>

              <Button
                onClick={handleNext}
                variant="gradient"
                className="w-full h-12 text-base font-bold"
                disabled={!confirmed}
              >
                友だち追加を完了して次へ進む
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>

              {/* Re-open LINE if needed */}
              <a
                href={LINE_FRIEND_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <ExternalLink className="w-4 h-4" />
                もう一度LINEを開く
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
