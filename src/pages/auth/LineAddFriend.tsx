import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, ChevronRight } from "lucide-react";
import logoImg from "@/assets/logo.png";

const LINE_FRIEND_ADD_URL = "https://line.me/R/ti/p/@616jfxwh";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
}

export default function LineAddFriend() {
  const navigate = useNavigate();
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [hasClickedAdd, setHasClickedAdd] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("lineProfile");
    if (!stored) {
      navigate("/auth/login");
      return;
    }
    setLineProfile(JSON.parse(stored));
  }, [navigate]);

  // Show next button 5 seconds after clicking add friend
  useEffect(() => {
    if (!hasClickedAdd) return;
    const timer = setTimeout(() => setShowNext(true), 5000);
    return () => clearTimeout(timer);
  }, [hasClickedAdd]);

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
              <img
                src={logoImg}
                alt="PRizm公式アカウント"
                className="w-14 h-14 rounded-full object-contain border-2 border-[#06C755]/30 bg-white p-1"
              />
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

          {/* Add Friend Button — <a> tag for natural browser return */}
          <a
            href={LINE_FRIEND_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setHasClickedAdd(true)}
            className="flex items-center justify-center w-full h-12 text-base font-bold bg-[#06C755] hover:bg-[#05B04C] text-white rounded-full gap-2 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            友だち追加する
          </a>

          {/* Next section — appears after delay */}
          {showNext && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
