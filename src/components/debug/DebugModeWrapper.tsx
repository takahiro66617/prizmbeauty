import React from "react";
import { DebugModeProvider } from "./DebugModeProvider";
import { DebugFloatingButton } from "./DebugFloatingButton";

export function DebugModeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DebugModeProvider>
      {children}
      <DebugFloatingButton />
    </DebugModeProvider>
  );
}
