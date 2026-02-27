import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

interface LogEntry {
  timestamp: string;
  level?: string;
  message?: string;
  stack?: string;
  action?: string;
  target?: string;
  path?: string;
}

interface SessionData {
  sessionId: string;
  errorLogs: LogEntry[];
  consoleLogs: LogEntry[];
  networkLogs: LogEntry[];
  interactionLogs: LogEntry[];
}

interface DebugContextValue {
  isActive: boolean;
  startSession: () => void;
  stopSession: () => void;
  getSessionData: () => SessionData | null;
  errorCount: number;
}

const DebugContext = createContext<DebugContextValue>({
  isActive: false,
  startSession: () => {},
  stopSession: () => {},
  getSessionData: () => null,
  errorCount: 0,
});

export const useDebugMode = () => useContext(DebugContext);

export function DebugModeProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const sessionRef = useRef<SessionData | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startSession = useCallback(() => {
    const rand = Math.random().toString(36).substring(2, 8);
    const sessionId = `dbg_${Date.now()}_${rand}`;
    const session: SessionData = {
      sessionId,
      errorLogs: [],
      consoleLogs: [],
      networkLogs: [],
      interactionLogs: [],
    };
    sessionRef.current = session;
    setErrorCount(0);

    // Save originals
    const origError = console.error;
    const origWarn = console.warn;
    const origFetch = window.fetch;
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;

    // Override console.error
    console.error = (...args: any[]) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      session.errorLogs.push({
        timestamp: new Date().toISOString(),
        level: "error",
        message: msg,
        stack: args[0]?.stack,
      });
      setErrorCount(c => c + 1);
      origError.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      session.consoleLogs.push({
        timestamp: new Date().toISOString(),
        level: "warn",
        message: msg,
      });
      origWarn.apply(console, args);
    };

    // Monkey-patch fetch
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const start = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || 'GET').toUpperCase();
      try {
        const res = await origFetch.apply(window, args);
        const elapsed = Date.now() - start;
        session.networkLogs.push({
          timestamp: new Date().toISOString(),
          level: res.ok ? "info" : "error",
          message: `${method} ${url} → ${res.status} (${elapsed}ms)`,
        });
        return res;
      } catch (err: any) {
        session.networkLogs.push({
          timestamp: new Date().toISOString(),
          level: "error",
          message: `${method} ${url} → FAILED: ${err.message}`,
        });
        throw err;
      }
    };

    // Click listener (capture phase)
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const actionable = target.closest('a, button, input, select, textarea, [role="button"], [role="menuitem"], [role="tab"]');
      const el = actionable || target;
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim().slice(0, 40);
      session.interactionLogs.push({
        timestamp: new Date().toISOString(),
        action: "click",
        target: `<${tag}> ${text}`,
        path: window.location.pathname + window.location.search,
      });
    };
    document.addEventListener("click", clickHandler, true);

    // Navigation intercepts
    history.pushState = function (...a: any[]) {
      origPushState.apply(this, a as any);
      session.interactionLogs.push({
        timestamp: new Date().toISOString(),
        action: "navigate (push)",
        target: String(a[2] || ''),
        path: window.location.pathname + window.location.search,
      });
    };
    history.replaceState = function (...a: any[]) {
      origReplaceState.apply(this, a as any);
      session.interactionLogs.push({
        timestamp: new Date().toISOString(),
        action: "navigate (replace)",
        target: String(a[2] || ''),
        path: window.location.pathname + window.location.search,
      });
    };
    const popHandler = () => {
      session.interactionLogs.push({
        timestamp: new Date().toISOString(),
        action: "navigate (popstate)",
        target: "",
        path: window.location.pathname + window.location.search,
      });
    };
    window.addEventListener("popstate", popHandler);

    // Unhandled errors
    const errorHandler = (e: ErrorEvent) => {
      session.errorLogs.push({
        timestamp: new Date().toISOString(),
        level: "error",
        message: e.message,
        stack: e.error?.stack,
      });
      setErrorCount(c => c + 1);
    };
    window.addEventListener("error", errorHandler);

    const rejectionHandler = (e: PromiseRejectionEvent) => {
      session.errorLogs.push({
        timestamp: new Date().toISOString(),
        level: "unhandled_rejection",
        message: String(e.reason),
        stack: e.reason?.stack,
      });
      setErrorCount(c => c + 1);
    };
    window.addEventListener("unhandledrejection", rejectionHandler);

    cleanupRef.current = () => {
      console.error = origError;
      console.warn = origWarn;
      window.fetch = origFetch;
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
      document.removeEventListener("click", clickHandler, true);
      window.removeEventListener("popstate", popHandler);
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };

    setIsActive(true);
  }, []);

  const stopSession = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    sessionRef.current = null;
    setIsActive(false);
    setErrorCount(0);
  }, []);

  const getSessionData = useCallback(() => {
    if (!sessionRef.current) return null;
    return JSON.parse(JSON.stringify(sessionRef.current)) as SessionData;
  }, []);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return (
    <DebugContext.Provider value={{ isActive, startSession, stopSession, getSessionData, errorCount }}>
      {children}
    </DebugContext.Provider>
  );
}
