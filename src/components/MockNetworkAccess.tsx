import { useState, useCallback } from "react";
import {
  Globe,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Laptop,
  Monitor,
  Copy,
  Check,
  Shield,
  Loader2,
  FolderOpen,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  Bot,
  User,
  SendHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

type Phase = "off" | "setup" | "live" | "phone";

interface ConnectedDevice {
  name: string;
  icon: typeof Smartphone;
  ip: string;
  since: string;
}

// ─── Data ─────────────────────────────────────────────────────

const DEVICES: ConnectedDevice[] = [
  { name: "iPhone 16 Pro", icon: Smartphone, ip: "192.168.1.42", since: "2m ago" },
  { name: "iPad Air", icon: Monitor, ip: "192.168.1.87", since: "5m ago" },
  { name: "MacBook (Office)", icon: Laptop, ip: "192.168.1.15", since: "12m ago" },
];

const MOCK_SESSIONS = [
  { name: "Refactoring auth module", model: "Opus", tokens: "124k", turns: 18, live: true, ctx: 67 },
  { name: "Add dark mode toggle", model: "Sonnet", tokens: "42k", turns: 7, live: true, ctx: 23 },
  { name: "Fix CI pipeline", model: "Sonnet", tokens: "89k", turns: 24, live: false, ctx: 81 },
];

const MOCK_CHAT: { type: "user" | "assistant"; text: string; tools?: string[] }[] = [
  { type: "user", text: "Refactor the auth module to use session tokens instead of raw passwords" },
  { type: "assistant", text: "I'll start by reading the current auth implementation to understand the existing flow.", tools: ["Read", "Read", "Grep"] },
  { type: "user", text: "Looks good, also add rate limiting" },
  { type: "assistant", text: "Adding rate limiting middleware with 5 attempts per minute per IP. I'll also add timing-safe comparison.", tools: ["Edit", "Edit", "Write"] },
  { type: "user", text: "Perfect, run the tests" },
  { type: "assistant", text: "All 24 tests passing. The auth module now uses hashed session tokens with rate limiting.", tools: ["Bash"] },
];

// ─── Main Component ───────────────────────────────────────────

export default function MockNetworkAccess() {
  const [phase, setPhase] = useState<Phase>("off");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneShowPw, setPhoneShowPw] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [phoneAuth, setPhoneAuth] = useState(false);
  const [phoneTab, setPhoneTab] = useState<"sessions" | "chat" | "stats">("sessions");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const networkUrl = "http://192.168.1.100:19384";

  const handleEnable = useCallback(() => {
    if (password.length > 0) {
      setPhase("live");
    }
  }, [password]);

  const handleCopy = useCallback(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const handlePhoneLogin = useCallback(() => {
    setConnecting(true);
    setPhoneError(false);
    setTimeout(() => {
      setConnecting(false);
      if (phonePassword === password) {
        setPhoneAuth(true);
      } else {
        setPhoneError(true);
      }
    }, 800);
  }, [phonePassword, password]);

  const reset = useCallback(() => {
    setPhase("off");
    setPassword("");
    setShowPassword(false);
    setCopied(false);
    setPhonePassword("");
    setPhoneShowPw(false);
    setPhoneError(false);
    setPhoneAuth(false);
    setConnecting(false);
    setPhoneTab("sessions");
    setSelectedSession(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Phase indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {(["off", "setup", "live", "phone"] as Phase[]).map((p, i) => (
          <button
            key={p}
            onClick={() => {
              if (p === "off") reset();
              else if (p === "setup") { setPhase("setup"); setPassword(""); }
              else if (p === "live") setPhase("live");
              else if (p === "phone") { setPhase("phone"); setPhoneAuth(false); setPhonePassword(""); setPhoneError(false); }
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors cursor-pointer ${
              phase === p
                ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
          >
            <span className="font-medium capitalize">{p === "off" ? "Disabled" : p === "setup" ? "Setup" : p === "live" ? "Connected" : "Phone"}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Desktop / Settings side */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-zinc-500 ml-1">Cogpit — Settings</span>
          </div>

          <div className="p-5 space-y-5">
            {/* Network toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {phase !== "off" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                    <Wifi className="h-4 w-4 text-green-400" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                    <WifiOff className="h-4 w-4 text-zinc-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-200">Network Access</p>
                  <p className="text-xs text-zinc-500">Allow other devices to connect</p>
                </div>
              </div>
              <button
                onClick={() => phase === "off" ? setPhase("setup") : reset()}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  phase !== "off" ? "bg-green-600" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    phase !== "off" ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Password field — setup phase */}
            {phase === "setup" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-xs text-zinc-400 block">
                  Set a password for remote access
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a password"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-9 pr-10 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  onClick={handleEnable}
                  disabled={password.length === 0}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    password.length > 0
                      ? "bg-green-600 text-white hover:bg-green-500 cursor-pointer"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  Enable Network Access
                </button>
              </div>
            )}

            {/* Live — connection URL + connected devices */}
            {(phase === "live" || phase === "phone") && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Connection URL */}
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-[11px] text-green-400/70 mb-1.5 font-medium">Connection URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-green-300 truncate">{networkUrl}</code>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-1 text-[11px] text-green-400 hover:bg-green-500/20 transition-colors shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2">
                    Open this URL on any device on your network
                  </p>
                </div>

                {/* Security info */}
                <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <Shield className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-zinc-400 leading-relaxed space-y-1">
                    <p><strong className="text-zinc-300">Password-protected</strong> — remote clients must authenticate</p>
                    <p><strong className="text-zinc-300">Rate-limited</strong> — 5 login attempts per minute per IP</p>
                    <p><strong className="text-zinc-300">Session tokens</strong> — 24h expiry, no raw passwords stored</p>
                  </div>
                </div>

                {/* Connected devices */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Connected devices</p>
                  <div className="space-y-1.5">
                    {DEVICES.map((d) => {
                      const Icon = d.icon;
                      return (
                        <div key={d.name} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                          <Icon className="h-4 w-4 text-zinc-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-200 truncate">{d.name}</p>
                            <p className="text-[10px] text-zinc-600">{d.ip}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-zinc-500">{d.since}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Phone mock */}
        <div className="flex items-center justify-center">
          <div className="relative w-[260px]">
            {/* Phone frame — 19.5:9 aspect ratio */}
            <div className="rounded-[2rem] border-[3px] border-zinc-700 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/50">
              {/* Dynamic Island */}
              <div className="flex justify-center pt-2 pb-0.5 bg-zinc-950">
                <div className="h-[18px] w-24 rounded-full bg-zinc-900 border border-zinc-800" />
              </div>

              {/* Screen content */}
              <div className="flex flex-col" style={{ height: 480 }}>
                {/* ── Disabled state ── */}
                {phase === "off" && (
                  <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                    <WifiOff className="h-10 w-10 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500 mb-1">Network access disabled</p>
                    <p className="text-[11px] text-zinc-600 px-4">
                      Enable it in settings to connect from this device
                    </p>
                  </div>
                )}

                {/* ── Setup state ── */}
                {phase === "setup" && (
                  <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                    <div className="h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3 animate-pulse">
                      <Wifi className="h-7 w-7 text-green-400" />
                    </div>
                    <p className="text-sm text-zinc-300 mb-1">Setting up...</p>
                    <p className="text-[11px] text-zinc-500 px-4">
                      Set a password on the left to enable connections
                    </p>
                  </div>
                )}

                {/* ── Login screen ── */}
                {(phase === "live" || phase === "phone") && !phoneAuth && (
                  <div className="flex flex-col flex-1 pt-10 px-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-200">Cogpit</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">Sign in to monitor sessions</p>
                    </div>

                    <div className="space-y-2.5 mt-5">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                        <input
                          type={phoneShowPw ? "text" : "password"}
                          value={phonePassword}
                          onChange={(e) => { setPhonePassword(e.target.value); setPhoneError(false); }}
                          placeholder="Enter your password"
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-8 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />
                        <button
                          onClick={() => setPhoneShowPw(!phoneShowPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {phoneShowPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                      {phoneError && (
                        <p className="text-[10px] text-red-400 text-center">Invalid password</p>
                      )}
                      <button
                        onClick={handlePhoneLogin}
                        disabled={connecting || !phonePassword}
                        className={`w-full rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                          phonePassword && !connecting
                            ? "bg-white text-zinc-900 hover:bg-zinc-200 cursor-pointer"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        }`}
                      >
                        {connecting ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Authenticating...
                          </span>
                        ) : (
                          "Sign In"
                        )}
                      </button>
                    </div>

                    <p className="text-[9px] text-zinc-700 text-center mt-4 px-4">
                      Protected by rate limiting and session tokens
                    </p>
                  </div>
                )}

                {/* ── Authenticated app ── */}
                {(phase === "live" || phase === "phone") && phoneAuth && (
                  <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center h-10 px-3 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
                      {(phoneTab === "chat" || phoneTab === "stats") && selectedSession !== null ? (
                        <>
                          <button
                            onClick={() => { setSelectedSession(null); setPhoneTab("sessions"); }}
                            className="shrink-0 mr-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-[11px] font-medium text-zinc-300 truncate flex-1">
                            {MOCK_SESSIONS[selectedSession].name}
                          </span>
                          {MOCK_SESSIONS[selectedSession].live && (
                            <span className="relative flex h-2 w-2 shrink-0 ml-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                            </span>
                          )}
                          <span className="text-[9px] text-green-400 ml-2 border border-green-700/60 bg-green-500/5 rounded px-1 py-0.5 font-semibold shrink-0">
                            {100 - MOCK_SESSIONS[selectedSession].ctx}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-blue-400 shrink-0 mr-2" />
                          <span className="text-[11px] font-semibold text-zinc-200">Cogpit</span>
                          <span className="flex-1" />
                          <span className="flex items-center gap-1 text-[9px] text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                          </span>
                        </>
                      )}
                    </div>

                    {/* Content area */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {/* Sessions tab */}
                      {phoneTab === "sessions" && (
                        <div className="p-2.5 space-y-1.5">
                          {MOCK_SESSIONS.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => { setSelectedSession(i); setPhoneTab("chat"); }}
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 space-y-1.5 text-left hover:border-zinc-700 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] font-medium text-zinc-200 truncate flex-1">{s.name}</p>
                                {s.live && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0 ml-2" />}
                              </div>
                              <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                                <span className="rounded bg-zinc-800 px-1 py-0.5">{s.model}</span>
                                <span>{s.tokens}</span>
                                <span>{s.turns} turns</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Chat tab */}
                      {phoneTab === "chat" && selectedSession !== null && (
                        <div className="p-2.5 space-y-2">
                          {MOCK_CHAT.map((msg, i) => (
                            <div key={i} className={`flex gap-2 ${msg.type === "user" ? "justify-end" : ""}`}>
                              {msg.type === "assistant" && (
                                <div className="h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <Bot className="h-3 w-3 text-purple-400" />
                                </div>
                              )}
                              <div className={`space-y-1 max-w-[85%] ${msg.type === "user" ? "items-end" : ""}`}>
                                <div className={`rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed ${
                                  msg.type === "user"
                                    ? "bg-blue-600/20 border border-blue-500/20 text-zinc-200"
                                    : "bg-zinc-900 border border-zinc-800 text-zinc-300"
                                }`}>
                                  {msg.text}
                                </div>
                                {msg.tools && (
                                  <div className="flex flex-wrap gap-1">
                                    {msg.tools.map((t, j) => (
                                      <span key={j} className="rounded border border-zinc-700 bg-zinc-800/50 px-1 py-0.5 text-[8px] text-zinc-500">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {msg.type === "user" && (
                                <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <User className="h-3 w-3 text-blue-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats tab */}
                      {phoneTab === "stats" && selectedSession !== null && (
                        <div className="p-3 space-y-3">
                          <div className="text-[11px] font-medium text-zinc-300 mb-2">Session Stats</div>
                          {[
                            { label: "Model", value: MOCK_SESSIONS[selectedSession].model },
                            { label: "Turns", value: String(MOCK_SESSIONS[selectedSession].turns) },
                            { label: "Tokens", value: MOCK_SESSIONS[selectedSession].tokens },
                            { label: "Context", value: `${MOCK_SESSIONS[selectedSession].ctx}% used` },
                            { label: "Est. Cost", value: "$0.42" },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                              <span className="text-[10px] text-zinc-500">{row.label}</span>
                              <span className="text-[10px] text-zinc-300 font-medium">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chat input — non-interactive */}
                    {phoneTab === "chat" && selectedSession !== null && (
                      <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-900/60 px-2.5 py-2">
                        <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2">
                          <span className="flex-1 text-[10px] text-zinc-600">Send a message...</span>
                          <SendHorizontal className="h-3 w-3 text-zinc-600" />
                        </div>
                      </div>
                    )}

                    {/* Bottom nav — matches real MobileNav */}
                    <nav className="flex shrink-0 items-stretch border-t border-zinc-800/80 bg-zinc-900/95">
                      {([
                        { id: "sessions" as const, label: "Sessions", icon: FolderOpen, show: true },
                        { id: "chat" as const, label: "Chat", icon: MessageSquare, show: true },
                        { id: "stats" as const, label: "Stats", icon: BarChart3, show: true },
                      ]).filter(t => t.show).map((tab) => {
                        const Icon = tab.icon;
                        const isActive = phoneTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setPhoneTab(tab.id);
                              if (tab.id === "sessions") setSelectedSession(null);
                              if ((tab.id === "chat" || tab.id === "stats") && selectedSession === null) setSelectedSession(0);
                            }}
                            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all cursor-pointer ${
                              isActive ? "text-blue-400" : "text-zinc-500"
                            }`}
                          >
                            <div className="relative">
                              {isActive && (
                                <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-0.5 w-0.5 rounded-full bg-blue-400" />
                              )}
                              <Icon className="h-4 w-4" />
                              {tab.id === "chat" && MOCK_SESSIONS.some(s => s.live) && (
                                <span className="absolute -right-1 -top-0.5 flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] font-medium">{tab.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                )}
              </div>

              {/* Home indicator */}
              <div className="flex justify-center py-1.5 bg-zinc-950">
                <div className="h-1 w-20 rounded-full bg-zinc-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
