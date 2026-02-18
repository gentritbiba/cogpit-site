import { useState } from "react";
import {
  User,
  Bot,
  GitFork,
  Redo2,
  Terminal,
  FileEdit,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

interface ToolCall {
  name: string;
  summary: string;
  status: "success" | "error";
}

interface Turn {
  id: number;
  type: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

interface BranchData {
  id: string;
  name: string;
  date: string;
  turns: Turn[];
}

// ─── Constants ────────────────────────────────────────────────

const TOOL_STYLES: Record<string, { bg: string; icon: typeof Terminal }> = {
  Read: { bg: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: FileText },
  Edit: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: FileEdit },
  Write: { bg: "bg-green-500/20 text-green-400 border-green-500/30", icon: FileEdit },
  Bash: { bg: "bg-red-500/20 text-red-400 border-red-500/30", icon: Terminal },
  Grep: { bg: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Search },
};

const BRANCH_POINT_IDX = 3;
const BRANCH_COLORS = ["#3b82f6", "#a855f7", "#f59e0b"];
const BRANCH_INNER = ["#60a5fa", "#c084fc", "#fbbf24"];

const NODE_SPACING = 88;
const GRAPH_WIDTH = 80;
const NODE_R = 6;
const MAIN_X = 28;
const BRANCH_X = 58;

// ─── Data ─────────────────────────────────────────────────────

const sharedTurns: Turn[] = [
  { id: 1, type: "user", content: "Build a user authentication system with JWT" },
  {
    id: 2, type: "assistant",
    content: "I'll set up the authentication system. Let me start with the user model and auth routes.",
    toolCalls: [
      { name: "Read", summary: "src/models/User.ts", status: "success" },
      { name: "Write", summary: "src/routes/auth.ts", status: "success" },
      { name: "Write", summary: "src/middleware/authenticate.ts", status: "success" },
    ],
  },
  { id: 3, type: "user", content: "Add password hashing and input validation" },
  {
    id: 4, type: "assistant",
    content: "Added bcrypt hashing and Zod validation schemas. All tests passing.",
    toolCalls: [
      { name: "Edit", summary: "src/routes/auth.ts — add bcrypt + zod", status: "success" },
      { name: "Write", summary: "src/validation/auth.schema.ts", status: "success" },
      { name: "Bash", summary: "bun test -- --grep auth", status: "success" },
    ],
  },
];

const allBranches: BranchData[] = [
  {
    id: "oauth", name: "OAuth with Google provider", date: "2/17/2026, 3:42 PM",
    turns: [
      { id: 5, type: "user", content: "Now add OAuth2 with Google provider" },
      {
        id: 6, type: "assistant",
        content: "Implementing Google OAuth2 with Passport.js strategy and callback routes.",
        toolCalls: [
          { name: "Bash", summary: "bun add passport passport-google-oauth20", status: "success" },
          { name: "Write", summary: "src/strategies/google.ts", status: "success" },
          { name: "Edit", summary: "src/routes/auth.ts — add OAuth routes", status: "success" },
          { name: "Bash", summary: "bun test", status: "error" },
        ],
      },
      { id: 7, type: "user", content: "The tests are failing, fix the session config" },
      {
        id: 8, type: "assistant",
        content: "Fixed session serialization and added mock OAuth provider for tests.",
        toolCalls: [
          { name: "Edit", summary: "src/strategies/google.ts — fix serialize", status: "success" },
          { name: "Write", summary: "tests/mocks/oauth.ts", status: "success" },
          { name: "Bash", summary: "bun test", status: "success" },
        ],
      },
    ],
  },
  {
    id: "magic-link", name: "Magic link authentication", date: "2/17/2026, 3:58 PM",
    turns: [
      { id: 5, type: "user", content: "Add magic link authentication instead" },
      {
        id: 6, type: "assistant",
        content: "Implementing passwordless magic link auth with email verification tokens.",
        toolCalls: [
          { name: "Write", summary: "src/services/magicLink.ts", status: "success" },
          { name: "Edit", summary: "src/routes/auth.ts — add /magic-link", status: "success" },
          { name: "Write", summary: "src/emails/magicLink.template.ts", status: "success" },
          { name: "Bash", summary: "bun test", status: "success" },
        ],
      },
    ],
  },
  {
    id: "webauthn", name: "WebAuthn passkeys", date: "2/17/2026, 4:15 PM",
    turns: [
      { id: 5, type: "user", content: "Use WebAuthn for passwordless auth with passkeys" },
      {
        id: 6, type: "assistant",
        content: "Setting up WebAuthn with @simplewebauthn/server for passkey registration and authentication.",
        toolCalls: [
          { name: "Bash", summary: "bun add @simplewebauthn/server", status: "success" },
          { name: "Write", summary: "src/services/webauthn.ts", status: "success" },
          { name: "Edit", summary: "src/routes/auth.ts — add passkey routes", status: "success" },
        ],
      },
      {
        id: 7, type: "assistant",
        content: "Added authenticator model and challenge verification. All passkey tests passing.",
        toolCalls: [
          { name: "Write", summary: "src/models/Authenticator.ts", status: "success" },
          { name: "Write", summary: "tests/webauthn.test.ts", status: "success" },
          { name: "Bash", summary: "bun test", status: "success" },
        ],
      },
    ],
  },
];

// ─── Branch Graph (left side) ─────────────────────────────────

function BranchGraph({
  totalTurns,
  undoneFrom,
  activeBranchIdx,
  branchTurnCount,
}: {
  totalTurns: number;
  undoneFrom: number;
  activeBranchIdx: number;
  branchTurnCount: number;
}) {
  const showCurve = activeBranchIdx > 0;
  const branchColor = BRANCH_COLORS[activeBranchIdx - 1] || BRANCH_COLORS[0];
  const branchInner = BRANCH_INNER[activeBranchIdx - 1] || BRANCH_INNER[0];
  const nodesOnMain = showCurve ? BRANCH_POINT_IDX + 1 : totalTurns;
  const maxIdx = showCurve ? BRANCH_POINT_IDX + branchTurnCount : totalTurns - 1;
  const height = (maxIdx + 1) * NODE_SPACING + 20;

  return (
    <svg width={GRAPH_WIDTH} height={height} className="shrink-0" style={{ minHeight: height }}>
      <defs>
        <linearGradient id="main-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="undone-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
      </defs>

      {/* Main line (branch 0 / no curve) */}
      {!showCurve && (
        <>
          <line
            x1={MAIN_X} y1={NODE_SPACING / 2}
            x2={MAIN_X} y2={(undoneFrom >= 0 ? undoneFrom : totalTurns - 1) * NODE_SPACING + NODE_SPACING / 2}
            stroke="url(#main-grad)" strokeWidth={2} className="transition-all duration-500"
          />
          {undoneFrom >= 0 && (
            <line
              x1={MAIN_X} y1={undoneFrom * NODE_SPACING + NODE_SPACING / 2}
              x2={MAIN_X} y2={(totalTurns - 1) * NODE_SPACING + NODE_SPACING / 2}
              stroke="url(#undone-grad)" strokeWidth={2} strokeDasharray="4 4"
              className="transition-all duration-500"
            />
          )}
        </>
      )}

      {/* Shared trunk (branches 1,2) */}
      {showCurve && nodesOnMain > 1 && (
        <line
          x1={MAIN_X} y1={NODE_SPACING / 2}
          x2={MAIN_X} y2={BRANCH_POINT_IDX * NODE_SPACING + NODE_SPACING / 2}
          stroke="url(#main-grad)" strokeWidth={2}
        />
      )}

      {/* Branch curve + nodes */}
      {showCurve && (
        <g className="animate-branch-appear">
          <path
            d={`M ${MAIN_X} ${BRANCH_POINT_IDX * NODE_SPACING + NODE_SPACING / 2} C ${MAIN_X} ${BRANCH_POINT_IDX * NODE_SPACING + NODE_SPACING}, ${BRANCH_X} ${BRANCH_POINT_IDX * NODE_SPACING + NODE_SPACING * 0.5}, ${BRANCH_X} ${(BRANCH_POINT_IDX + 1) * NODE_SPACING + NODE_SPACING / 2}`}
            fill="none" stroke={branchColor} strokeWidth={2}
          />
          {branchTurnCount > 1 && (
            <line
              x1={BRANCH_X} y1={(BRANCH_POINT_IDX + 1) * NODE_SPACING + NODE_SPACING / 2}
              x2={BRANCH_X} y2={(BRANCH_POINT_IDX + branchTurnCount) * NODE_SPACING + NODE_SPACING / 2}
              stroke={branchColor} strokeWidth={2}
            />
          )}
          {Array.from({ length: branchTurnCount }).map((_, i) => {
            const y = (BRANCH_POINT_IDX + 1 + i) * NODE_SPACING + NODE_SPACING / 2;
            return (
              <g key={`branch-${i}`} style={{ animationDelay: `${(i + 1) * 150}ms` }} className="animate-node-pop">
                <circle cx={BRANCH_X} cy={y} r={NODE_R + 4} fill={branchColor} opacity={0.15} />
                <circle cx={BRANCH_X} cy={y} r={NODE_R} fill="#18181b" stroke={branchColor} strokeWidth={2} />
                <circle cx={BRANCH_X} cy={y} r={2.5} fill={branchInner} />
              </g>
            );
          })}
        </g>
      )}

      {/* Branch point ring */}
      {showCurve && (
        <circle
          cx={MAIN_X} cy={BRANCH_POINT_IDX * NODE_SPACING + NODE_SPACING / 2}
          r={NODE_R + 8} fill="none" stroke={branchColor} strokeWidth={1.5} opacity={0.4}
          className="animate-pulse-ring"
        />
      )}

      {/* Main/shared nodes */}
      {Array.from({ length: nodesOnMain }).map((_, i) => {
        const y = i * NODE_SPACING + NODE_SPACING / 2;
        const isUndone = !showCurve && undoneFrom >= 0 && i >= undoneFrom;
        const isUser = i % 2 === 0;
        const nodeColor = isUndone ? "#3f3f46" : isUser ? "#3b82f6" : "#22c55e";
        const innerColor = isUndone ? "#27272a" : isUser ? "#60a5fa" : "#4ade80";
        return (
          <g key={`main-${i}`} className="transition-all duration-500" style={{ opacity: isUndone ? 0.35 : 1 }}>
            {!isUndone && <circle cx={MAIN_X} cy={y} r={NODE_R + 4} fill={nodeColor} opacity={0.15} />}
            <circle cx={MAIN_X} cy={y} r={NODE_R} fill="#18181b" stroke={nodeColor} strokeWidth={2} />
            <circle cx={MAIN_X} cy={y} r={2.5} fill={innerColor} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Mini Branch Graph (modal) ────────────────────────────────

// Unified display list: current + archived
interface DisplayBranch {
  kind: "current" | "archived";
  id: string;
  name: string;
  date: string;
  turns: Turn[];
  graphNodeCount: number;
  sourceIdx: number; // index into allBranches (-1 for current)
}

const DISPLAY_BRANCHES: DisplayBranch[] = [
  {
    kind: "current",
    id: "__current__",
    name: "Current branch",
    date: "",
    turns: sharedTurns,
    graphNodeCount: 4,
    sourceIdx: -1,
  },
  ...allBranches.map((b, i) => ({
    kind: "archived" as const,
    id: b.id,
    name: b.name,
    date: b.date,
    turns: b.turns,
    graphNodeCount: b.turns.length,
    sourceIdx: i,
  })),
];

function MiniBranchGraph({ activeBranchIdx }: { activeBranchIdx: number }) {
  const bpX = 120;
  const sharedXs = [20, 45, 70, 95, bpX];
  const ns = 32;
  const branchNodeCounts = [4, 4, 2, 3]; // current + 3 archived
  const branchYs = [18, 45, 72, 99];
  const branchLabels = ["Current", "OAuth", "Magic Link", "WebAuthn"];
  const colors = ["#3b82f6", ...BRANCH_COLORS];
  const inners = ["#60a5fa", ...BRANCH_INNER];

  return (
    <svg width="100%" height="112" viewBox="0 0 340 112" className="mt-1">
      {/* Shared trunk */}
      <line x1={20} y1={18} x2={bpX} y2={18} stroke="#3b82f6" strokeWidth={2} />
      {sharedXs.slice(0, -1).map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={18} r={3.5} fill="#09090b" stroke="#3b82f6" strokeWidth={1.5} />
          <circle cx={x} cy={18} r={1.5} fill="#60a5fa" />
        </g>
      ))}
      {/* Branch point */}
      <circle cx={bpX} cy={18} r={5} fill="#09090b" stroke="#a855f7" strokeWidth={2} />
      <circle cx={bpX} cy={18} r={2} fill="#c084fc" />

      {/* Branches */}
      {branchNodeCounts.map((count, bi) => {
        const isActive = bi === activeBranchIdx;
        const color = isActive ? colors[bi] : "#27272a";
        const inner = isActive ? inners[bi] : "#3f3f46";
        const y = branchYs[bi];
        return (
          <g key={bi} className="transition-all duration-500" style={{ opacity: isActive ? 1 : 0.3 }}>
            {bi === 0 ? (
              <line x1={bpX} y1={y} x2={bpX + count * ns} y2={y} stroke={color} strokeWidth={2} />
            ) : (
              <>
                <path
                  d={`M ${bpX} 18 C ${bpX + 10} ${y - 5}, ${bpX + 20} ${y}, ${bpX + ns} ${y}`}
                  fill="none" stroke={color} strokeWidth={2}
                />
                {count > 1 && (
                  <line x1={bpX + ns} y1={y} x2={bpX + count * ns} y2={y} stroke={color} strokeWidth={2} />
                )}
              </>
            )}
            {Array.from({ length: count }).map((_, ni) => (
              <g key={ni}>
                <circle cx={bpX + (ni + 1) * ns} cy={y} r={3.5} fill="#09090b" stroke={color} strokeWidth={1.5} />
                <circle cx={bpX + (ni + 1) * ns} cy={y} r={1.5} fill={inner} />
              </g>
            ))}
            <text
              x={bpX + (count + 0.4) * ns} y={y + 3.5}
              fill={isActive ? colors[bi] : "#3f3f46"}
              fontSize="8" fontFamily="monospace"
              className="transition-all duration-500"
            >
              {branchLabels[bi]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Tool Badge ───────────────────────────────────────────────

function ToolBadge({ tool }: { tool: ToolCall }) {
  const style = TOOL_STYLES[tool.name] || { bg: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: Terminal };
  const Icon = style.icon;
  return (
    <div className="flex items-center gap-1 min-w-0 shrink overflow-hidden">
      <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${style.bg}`}>
        <Icon className="h-2.5 w-2.5" />
        {tool.name}
      </span>
      <span className="text-[10px] text-zinc-500 truncate min-w-0 hidden sm:block">{tool.summary}</span>
      {tool.status === "success" ? (
        <CheckCircle className="h-3 w-3 text-green-500/70 shrink-0" />
      ) : (
        <XCircle className="h-3 w-3 text-red-500/70 shrink-0" />
      )}
    </div>
  );
}

// ─── Turn Card ────────────────────────────────────────────────

function TurnCard({
  turn,
  index,
  isUndone,
  isBranchPoint,
  onBranch,
}: {
  turn: Turn;
  index: number;
  isUndone: boolean;
  isBranchPoint: boolean;
  onBranch?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-500 ease-out overflow-hidden ${
        isUndone
          ? "border-zinc-800/20 bg-zinc-900/5 opacity-30 scale-[0.98] translate-x-1"
          : "border-zinc-800/60 bg-zinc-900/40"
      }`}
      style={{ minHeight: NODE_SPACING - 8, animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3 h-full">
        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
          {turn.type === "user" ? (
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-500 ${isUndone ? "bg-zinc-800" : "bg-blue-500/20"}`}>
              <User className={`h-3.5 w-3.5 transition-colors duration-500 ${isUndone ? "text-zinc-600" : "text-blue-400"}`} />
            </div>
          ) : (
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-500 ${isUndone ? "bg-zinc-800" : "bg-green-500/20"}`}>
              <Bot className={`h-3.5 w-3.5 transition-colors duration-500 ${isUndone ? "text-zinc-600" : "text-green-400"}`} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium transition-colors duration-500 ${isUndone ? "text-zinc-600" : turn.type === "user" ? "text-blue-400" : "text-green-400"}`}>
              {turn.type === "user" ? "You" : "Claude"}
            </span>
            <span className="text-[10px] text-zinc-600">turn {turn.id}</span>
            {isUndone && (
              <span className="rounded border border-zinc-700/50 bg-zinc-800/50 px-1.5 py-0.5 text-[9px] text-zinc-600 animate-fade-in">undone</span>
            )}
            {isBranchPoint && !isUndone && (
              <button
                onClick={onBranch}
                className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-400 hover:bg-purple-500/20 transition-colors animate-fade-in cursor-pointer"
              >
                <GitFork className="h-2.5 w-2.5" />
                branch point
              </button>
            )}
          </div>
          <p className={`text-xs leading-relaxed transition-colors duration-500 ${isUndone ? "text-zinc-700" : "text-zinc-300"}`}>
            {turn.content}
          </p>
          {turn.toolCalls && !isUndone && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {turn.toolCalls.map((tool, j) => (
                <ToolBadge key={j} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function shortFile(summary: string): string {
  const match = summary.match(/([^/\s]+\.[a-z]+)/);
  return match ? match[1] : summary.split("—")[0].trim();
}

// ─── Main Component ───────────────────────────────────────────

export default function MockBranchView() {
  // null = current/main branch (shared turns only), 0/1/2 = archived branch
  const [activeBranchIdx, setActiveBranchIdx] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalBranchIdx, setModalBranchIdx] = useState(0);

  const branch = activeBranchIdx !== null ? allBranches[activeBranchIdx] : null;
  const turns = branch ? [...sharedTurns, ...branch.turns] : sharedTurns;

  const switchToBranch = (sourceIdx: number) => {
    // sourceIdx === -1 means current branch
    setActiveBranchIdx(sourceIdx >= 0 ? sourceIdx : null);
    setShowModal(false);
  };

  const openModal = () => {
    // Open modal on the matching display branch
    // displayIdx 0 = current, 1+ = archived branches
    const displayIdx = activeBranchIdx !== null ? activeBranchIdx + 1 : 0;
    setModalBranchIdx(displayIdx);
    setShowModal(true);
  };

  const modalDisplay = DISPLAY_BRANCHES[modalBranchIdx];
  const isCurrent = modalDisplay.kind === "current";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <button
          onClick={openModal}
          className="shimmer flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs text-purple-400 transition-all hover:bg-purple-500/20 hover:border-purple-500/50 active:scale-95 cursor-pointer"
        >
          <GitFork className="h-3.5 w-3.5" />
          {DISPLAY_BRANCHES.length} branches
        </button>
      </div>

      {/* Timeline with graph */}
      <div className="flex gap-0">
        <BranchGraph
          totalTurns={turns.length}
          undoneFrom={-1}
          activeBranchIdx={activeBranchIdx !== null ? activeBranchIdx + 1 : 0}
          branchTurnCount={branch ? branch.turns.length : 0}
        />
        <div className="flex-1 min-w-0 space-y-1">
          {turns.map((turn, i) => (
            <TurnCard
              key={`${activeBranchIdx ?? "current"}-${turn.id}-${i}`}
              turn={turn}
              index={i}
              isUndone={false}
              isBranchPoint={false}
            />
          ))}
        </div>
      </div>

      {/* ─── Branch Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10%] animate-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <GitFork className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-semibold text-zinc-200">
                  Branches from Turn {BRANCH_POINT_IDX + 1}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Arrow navigation */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <button
                onClick={() => setModalBranchIdx((i) => (i > 0 ? i - 1 : DISPLAY_BRANCHES.length - 1))}
                disabled={DISPLAY_BRANCHES.length <= 1}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 text-center min-w-0">
                <div className="text-sm font-medium text-zinc-200 truncate">
                  {modalDisplay.name}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center rounded border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400 font-medium">
                      active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Branch {modalBranchIdx + 1} of {DISPLAY_BRANCHES.length}
                  {!isCurrent && <> &middot; {modalDisplay.date}</>}
                </div>
              </div>
              <button
                onClick={() => setModalBranchIdx((i) => (i < DISPLAY_BRANCHES.length - 1 ? i + 1 : 0))}
                disabled={DISPLAY_BRANCHES.length <= 1}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Mini branch graph — at the top */}
            <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 shrink-0">
              <MiniBranchGraph activeBranchIdx={modalBranchIdx} />
            </div>

            {/* Turn previews — scrollable */}
            <div className="rounded-xl border border-zinc-700/50 bg-zinc-950/30 p-4 space-y-2.5 min-h-0 flex-1 overflow-y-auto">
              {modalDisplay.turns.map((turn, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                        turn.type === "user" ? "bg-blue-400" : "bg-green-400"
                      }`}
                    />
                    <p className="text-xs text-zinc-300 leading-relaxed">{turn.content}</p>
                  </div>

                  {turn.toolCalls?.map((tool, j) => {
                    const s = TOOL_STYLES[tool.name];
                    return (
                      <div key={j} className="flex items-center gap-3 mt-1.5 ml-0.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-zinc-600 shrink-0" />
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono ${
                            s?.bg || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                          }`}
                        >
                          {tool.name} {shortFile(tool.summary)}
                        </span>
                      </div>
                    );
                  })}

                  {i < modalDisplay.turns.length - 1 && (
                    <div className="border-t border-zinc-800/50 mt-3" />
                  )}
                </div>
              ))}

              {/* Redo to here (only for archived branches) */}
              {!isCurrent && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => switchToBranch(modalDisplay.sourceIdx)}
                    className="flex items-center gap-1 text-[11px] text-blue-400/70 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <Redo2 className="h-3 w-3" />
                    Redo to here
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500">
                {modalDisplay.turns.length} turn{modalDisplay.turns.length !== 1 ? "s" : ""} in this branch
              </span>
              {!isCurrent && (
                <button
                  onClick={() => switchToBranch(modalDisplay.sourceIdx)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors active:scale-95 cursor-pointer"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                  Redo entire branch
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
