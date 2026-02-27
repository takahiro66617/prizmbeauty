import { useState } from "react";
import { createPortal } from "react-dom";
import { Bug, Square } from "lucide-react";
import { useDebugMode } from "./DebugModeProvider";
import { DebugReportModal } from "./DebugReportModal";

export function DebugFloatingButton() {
  const { isActive, startSession, stopSession, errorCount } = useDebugMode();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    if (!isActive) {
      startSession();
    } else {
      stopSession();
    }
  };

  return createPortal(
    <>
      <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 2147483647 }} className="flex flex-col items-end gap-1">
        {isActive && (
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs bg-destructive text-destructive-foreground px-3 py-1 rounded-full shadow-md hover:opacity-90 transition-opacity"
          >
            バグ報告
          </button>
        )}
        <button
          onClick={handleClick}
          className={`relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
            isActive
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isActive ? <Square className="w-5 h-5" /> : <Bug className="w-5 h-5" />}
          {isActive && errorCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse border-2 border-background">
              {errorCount}
            </span>
          )}
        </button>
      </div>
      <DebugReportModal open={modalOpen} onOpenChange={setModalOpen} />
    </>,
    document.body
  );
}
