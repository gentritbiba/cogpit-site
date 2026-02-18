import { useState } from "react";
import {
  Users,
  ListTodo,
  MessageSquare,
  Crown,
  Clock,
  Play,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  ExternalLink,
  User,
  Bot,
  Terminal,
  FileEdit,
  FileText,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

interface Member {
  name: string;
  role: string;
  model: string;
  color: string;
  textColor: string;
  borderColor: string;
  isLead: boolean;
  task: string | null;
}

interface Task {
  id: string;
  subject: string;
  status: "pending" | "in_progress" | "completed";
  owner: string | null;
  blockedBy: string[];
  blocks: string[];
}

interface TeamMessage {
  from: string;
  content: string;
  time: string;
  type: "chat" | "task" | "idle" | "shutdown";
}

interface ToolCall {
  name: string;
  summary: string;
  status: "success" | "error";
}

interface SessionTurn {
  type: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

// ─── Data ─────────────────────────────────────────────────────

const members: Member[] = [
  {
    name: "team-lead",
    role: "team-lead",
    model: "opus",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    isLead: true,
    task: "Coordinating implementation",
  },
  {
    name: "frontend-dev",
    role: "developer",
    model: "sonnet",
    color: "bg-green-500",
    textColor: "text-green-400",
    borderColor: "border-green-500/30",
    isLead: false,
    task: "Building dashboard UI",
  },
  {
    name: "backend-dev",
    role: "developer",
    model: "sonnet",
    color: "bg-yellow-500",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    isLead: false,
    task: null,
  },
  {
    name: "researcher",
    role: "explorer",
    model: "haiku",
    color: "bg-purple-500",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    isLead: false,
    task: "Analyzing API patterns",
  },
];

const memberMap = new Map(members.map((m) => [m.name, m]));

const tasks: Task[] = [
  { id: "1", subject: "Set up project scaffold", status: "completed", owner: "team-lead", blockedBy: [], blocks: ["2", "3"] },
  { id: "2", subject: "Implement auth system", status: "completed", owner: "backend-dev", blockedBy: ["1"], blocks: ["5"] },
  { id: "3", subject: "Build dashboard components", status: "in_progress", owner: "frontend-dev", blockedBy: ["1"], blocks: ["6"] },
  { id: "4", subject: "Research API integration", status: "in_progress", owner: "researcher", blockedBy: [], blocks: [] },
  { id: "5", subject: "Add WebSocket support", status: "pending", owner: null, blockedBy: ["2"], blocks: ["7"] },
  { id: "6", subject: "Write E2E tests", status: "pending", owner: null, blockedBy: ["3"], blocks: ["7"] },
  { id: "7", subject: "Deploy to staging", status: "pending", owner: null, blockedBy: ["5", "6"], blocks: [] },
];

const teamMessages: TeamMessage[] = [
  { from: "team-lead", content: "Starting the implementation. I'll coordinate tasks — check TaskList for your assignments.", time: "14m ago", type: "chat" },
  { from: "backend-dev", content: "Auth system complete with JWT + refresh tokens. All tests passing.", time: "12m ago", type: "task" },
  { from: "team-lead", content: "Great work! Can you also add the settings page when you're done with the dashboard?", time: "10m ago", type: "chat" },
  { from: "researcher", content: "Found existing patterns in src/lib/hooks. The useQuery hook already handles caching.", time: "8m ago", type: "chat" },
  { from: "frontend-dev", content: "Dashboard layout is done. Moving on to the interactive components now.", time: "5m ago", type: "chat" },
  { from: "backend-dev", content: "Went idle", time: "3m ago", type: "idle" },
  { from: "team-lead", content: "Assigned task #5 to backend-dev: Add WebSocket support", time: "2m ago", type: "task" },
];

// Mock session data per member
const memberSessions: Record<string, SessionTurn[]> = {
  "team-lead": [
    { type: "user", content: "Create a team to implement the auth feature. We need frontend, backend, and research agents." },
    {
      type: "assistant",
      content: "I'll create the team and set up the task list. Let me start by spawning the team and defining the tasks.",
      toolCalls: [
        { name: "Bash", summary: "TeamCreate feature-auth", status: "success" },
        { name: "Write", summary: "tasks/feature-auth/task-1.json", status: "success" },
        { name: "Write", summary: "tasks/feature-auth/task-2.json", status: "success" },
      ],
    },
    { type: "assistant", content: "Team created. Spawning teammates now — frontend-dev (sonnet), backend-dev (sonnet), and researcher (haiku).", toolCalls: [
      { name: "Bash", summary: "Task spawn frontend-dev", status: "success" },
      { name: "Bash", summary: "Task spawn backend-dev", status: "success" },
      { name: "Bash", summary: "Task spawn researcher", status: "success" },
    ]},
    { type: "assistant", content: "All agents are online. Assigning tasks and coordinating. Backend-dev is starting on auth, frontend-dev on dashboard components, researcher is analyzing API patterns." },
  ],
  "frontend-dev": [
    { type: "user", content: "Build the dashboard components for the auth feature. Check task #3 for details." },
    {
      type: "assistant",
      content: "I'll start by reading the existing components to understand the patterns, then build the dashboard.",
      toolCalls: [
        { name: "Read", summary: "src/components/Layout.tsx", status: "success" },
        { name: "Read", summary: "src/styles/globals.css", status: "success" },
        { name: "Glob", summary: "src/components/**/*.tsx", status: "success" },
      ],
    },
    {
      type: "assistant",
      content: "Found the component patterns. Creating the dashboard layout with sidebar navigation and main content area.",
      toolCalls: [
        { name: "Write", summary: "src/components/Dashboard.tsx", status: "success" },
        { name: "Write", summary: "src/components/Sidebar.tsx", status: "success" },
        { name: "Edit", summary: "src/App.tsx — add dashboard route", status: "success" },
        { name: "Bash", summary: "bun run build", status: "success" },
      ],
    },
    { type: "assistant", content: "Dashboard layout is done. Moving on to the interactive components now — user profile card, settings panel, and auth status widget." },
  ],
  "backend-dev": [
    { type: "user", content: "Implement the auth system with JWT. Check task #2 for details." },
    {
      type: "assistant",
      content: "I'll implement JWT authentication with access and refresh tokens. Let me set up the auth module.",
      toolCalls: [
        { name: "Read", summary: "src/models/User.ts", status: "success" },
        { name: "Write", summary: "src/services/auth.ts", status: "success" },
        { name: "Write", summary: "src/middleware/authenticate.ts", status: "success" },
        { name: "Write", summary: "src/routes/auth.ts", status: "success" },
      ],
    },
    {
      type: "assistant",
      content: "Auth routes created. Adding bcrypt password hashing and Zod validation, then running tests.",
      toolCalls: [
        { name: "Edit", summary: "src/services/auth.ts — add bcrypt", status: "success" },
        { name: "Write", summary: "src/validation/auth.schema.ts", status: "success" },
        { name: "Bash", summary: "bun test -- --grep auth", status: "success" },
      ],
    },
    { type: "assistant", content: "Auth system complete with JWT + refresh tokens. All tests passing. Marking task #2 as completed." },
  ],
  "researcher": [
    { type: "user", content: "Research the existing API integration patterns in the codebase. Check task #4." },
    {
      type: "assistant",
      content: "I'll analyze the codebase to find existing patterns for API integration, focusing on hooks, services, and data fetching.",
      toolCalls: [
        { name: "Grep", summary: "useQuery|useMutation|fetch\\(", status: "success" },
        { name: "Read", summary: "src/lib/hooks/useQuery.ts", status: "success" },
        { name: "Read", summary: "src/lib/api-client.ts", status: "success" },
        { name: "Glob", summary: "src/services/**/*.ts", status: "success" },
      ],
    },
    {
      type: "assistant",
      content: "Found existing patterns in src/lib/hooks. The useQuery hook already handles caching with stale-while-revalidate. The api-client uses a base fetch wrapper with auth headers. I'll document these findings.",
      toolCalls: [
        { name: "Read", summary: "src/lib/hooks/useMutation.ts", status: "success" },
        { name: "Read", summary: "src/services/users.ts", status: "success" },
      ],
    },
    { type: "assistant", content: "Analysis complete. Key findings: useQuery has built-in caching (SWR pattern), api-client handles token refresh automatically, and all services follow the repository pattern. Sending findings to team-lead." },
  ],
};

// ─── Tool Styles ──────────────────────────────────────────────

const TOOL_STYLES: Record<string, { bg: string; icon: typeof Terminal }> = {
  Read: { bg: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: FileText },
  Edit: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: FileEdit },
  Write: { bg: "bg-green-500/20 text-green-400 border-green-500/30", icon: FileEdit },
  Bash: { bg: "bg-red-500/20 text-red-400 border-red-500/30", icon: Terminal },
  Grep: { bg: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Search },
  Glob: { bg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: Search },
};

// ─── Members Bar ──────────────────────────────────────────────

function MockMembersBar({
  currentMember,
  onMemberClick,
  onTeamClick,
}: {
  currentMember: string | null;
  onMemberClick: (name: string) => void;
  onTeamClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-3 py-1.5 overflow-x-auto">
      <button
        onClick={onTeamClick}
        className="shimmer flex items-center gap-1.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Users className="size-3" />
        <span>feature-auth</span>
      </button>
      <div className="h-3.5 w-px bg-zinc-700/50 shrink-0" />
      <div className="flex items-center gap-1">
        {members.map((member) => {
          const isCurrent = member.name === currentMember;
          return (
            <button
              key={member.name}
              onClick={() => onMemberClick(member.name)}
              className={`shimmer flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] transition-all whitespace-nowrap ${
                isCurrent
                  ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30"
                  : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
              }`}
            >
              <span className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${member.color}`} />
              <span>{member.name}</span>
              {member.isLead && <Crown className="size-2.5 shrink-0 text-yellow-500/70" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Session View (member's conversation) ─────────────────────

function MockSessionView({ memberName }: { memberName: string }) {
  const turns = memberSessions[memberName] || [];
  const member = memberMap.get(memberName);

  return (
    <div className="px-4 py-4 space-y-3">
      {turns.map((turn, i) => (
        <div key={i} className="shimmer rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
          <div className="flex items-start gap-2.5">
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {turn.type === "user" ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-500/20">
                  <Bot className="h-3.5 w-3.5 text-green-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${turn.type === "user" ? "text-blue-400" : "text-green-400"}`}>
                  {turn.type === "user" ? "You" : member?.name ?? "Claude"}
                </span>
                <span className="text-[10px] text-zinc-600">turn {i + 1}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{turn.content}</p>

              {/* Tool calls */}
              {turn.toolCalls && turn.toolCalls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {turn.toolCalls.map((tc, j) => {
                    const style = TOOL_STYLES[tc.name] || { bg: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: Terminal };
                    const Icon = style.icon;
                    return (
                      <div key={j} className="flex items-center gap-1 min-w-0 shrink overflow-hidden">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${style.bg}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {tc.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate min-w-0 hidden sm:block">{tc.summary}</span>
                        {tc.status === "success" ? (
                          <CheckCircle className="h-3 w-3 text-green-500/70 shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500/70 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Members Grid ─────────────────────────────────────────────

function MembersGrid({ onMemberClick }: { onMemberClick: (name: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {members.map((member) => (
        <div
          key={member.name}
          onClick={() => onMemberClick(member.name)}
          className={`shimmer flex flex-col gap-1.5 rounded-lg border p-3 bg-zinc-900/50 transition-colors group hover:bg-zinc-800/60 cursor-pointer ${member.borderColor}`}
        >
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${member.color}`} />
            <span className="text-xs font-medium text-zinc-200 truncate">{member.name}</span>
            {member.isLead && <Crown className="size-3 shrink-0 text-yellow-500" />}
            <ExternalLink className="size-3 shrink-0 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex h-4 items-center rounded-md bg-zinc-800 px-1.5 text-[9px] font-normal text-zinc-400">
              {member.role}
            </span>
            <span className="inline-flex h-4 items-center rounded-md border border-zinc-700 px-1.5 text-[9px] font-normal text-zinc-500">
              {member.model}
            </span>
          </div>
          {member.task && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Loader2 className="size-3 shrink-0 animate-spin text-blue-400" />
              <span className="text-[10px] text-blue-300 truncate">{member.task}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Task Board ───────────────────────────────────────────────

const COLUMNS = [
  { key: "pending" as const, label: "Pending", icon: Clock, headerColor: "text-zinc-400" },
  { key: "in_progress" as const, label: "In Progress", icon: Play, headerColor: "text-blue-400" },
  { key: "completed" as const, label: "Completed", icon: CheckCircle2, headerColor: "text-green-400" },
];

function TaskBoard() {
  const tasksByStatus = {
    pending: tasks.filter((t) => t.status === "pending"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {COLUMNS.map((col) => {
        const colTasks = tasksByStatus[col.key];
        return (
          <div key={col.key} className="flex flex-col gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${col.headerColor}`}>
              <col.icon className="size-3.5" />
              <span>{col.label}</span>
              <span className="ml-auto inline-flex h-4 items-center rounded-md bg-zinc-800 px-1.5 text-[10px] font-normal text-zinc-500">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {colTasks.map((task) => {
                const owner = task.owner ? memberMap.get(task.owner) : null;
                const isBlocked =
                  task.blockedBy.length > 0 &&
                  task.blockedBy.some((id) => {
                    const blocker = tasks.find((t) => t.id === id);
                    return blocker && blocker.status !== "completed";
                  });

                return (
                  <div
                    key={task.id}
                    className={`flex flex-col gap-1.5 rounded-lg border p-2.5 bg-zinc-900/50 transition-colors ${
                      isBlocked ? "border-yellow-800/40 opacity-70" : "border-zinc-800"
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="shrink-0 text-[10px] font-mono text-zinc-600 mt-0.5">#{task.id}</span>
                      <span className="text-xs text-zinc-300 leading-snug">{task.subject}</span>
                    </div>
                    {task.owner && owner && (
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${owner.color}`} />
                        <span className="text-[10px] text-zinc-500">{task.owner}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-wrap">
                      {isBlocked && (
                        <span className="inline-flex items-center gap-0.5 h-4 rounded-md border border-yellow-700/50 px-1 text-[9px] font-normal text-yellow-500">
                          <Lock className="size-2" />
                          Blocked by {task.blockedBy.map((id) => `#${id}`).join(", ")}
                        </span>
                      )}
                      {task.blocks.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 h-4 rounded-md border border-zinc-700 px-1 text-[9px] font-normal text-zinc-500">
                          <ArrowRight className="size-2" />
                          Blocks {task.blocks.map((id) => `#${id}`).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Message Timeline ─────────────────────────────────────────

function MessageTimeline() {
  return (
    <div className="flex flex-col gap-0.5">
      {teamMessages.map((msg, i) => {
        const member = memberMap.get(msg.from);
        const isSystemish = msg.type === "idle";

        return (
          <div
            key={i}
            className={`flex gap-2 rounded-md px-2 py-1.5 transition-colors ${
              isSystemish ? "opacity-40" : "hover:bg-zinc-900/50"
            }`}
          >
            <span className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${member?.color ?? "bg-zinc-500"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-medium ${member?.textColor ?? "text-zinc-400"}`}>{msg.from}</span>
                <span className="text-[10px] text-zinc-600">{msg.time}</span>
                {msg.type === "task" && (
                  <span className="text-[9px] text-zinc-600 bg-zinc-800 rounded px-1">task</span>
                )}
                {msg.type === "idle" && (
                  <span className="text-[9px] text-zinc-700 bg-zinc-800/50 rounded px-1">idle</span>
                )}
                {msg.type === "shutdown" && (
                  <span className="text-[9px] text-red-700 bg-red-950/50 rounded px-1">shutdown</span>
                )}
              </div>
              <p className={`mt-0.5 text-xs leading-relaxed ${msg.type === "chat" ? "text-zinc-400" : "text-zinc-500"}`}>
                {msg.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────

function DashboardView({ onMemberClick }: { onMemberClick: (name: string) => void }) {
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users className="size-4 text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-200 truncate">feature-auth</span>
          <span className="inline-flex items-center gap-1 h-5 rounded-md border border-green-700 px-1.5 text-[10px] font-semibold text-green-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex h-5 items-center rounded-md border border-zinc-700 px-1.5 text-[10px] font-normal text-zinc-400">
            {members.length} members
          </span>
          <span className="inline-flex h-5 items-center rounded-md border border-zinc-700 px-1.5 text-[10px] font-normal text-zinc-400">
            {completedCount}/{tasks.length} tasks
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        <section>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Users className="size-3.5 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Members</h3>
          </div>
          <MembersGrid onMemberClick={onMemberClick} />
        </section>

        <div className="border-t border-zinc-800" />

        <section>
          <div className="flex items-center gap-1.5 mb-2.5">
            <ListTodo className="size-3.5 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tasks</h3>
          </div>
          <TaskBoard />
        </section>

        <div className="border-t border-zinc-800" />

        <section>
          <div className="flex items-center gap-1.5 mb-2.5">
            <MessageSquare className="size-3.5 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Activity</h3>
          </div>
          <MessageTimeline />
        </section>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function MockTeamsDashboard() {
  const [view, setView] = useState<"dashboard" | "session">("dashboard");
  const [currentMember, setCurrentMember] = useState<string | null>(null);

  const handleMemberClick = (name: string) => {
    setCurrentMember(name);
    setView("session");
  };

  const handleTeamClick = () => {
    setView("dashboard");
    setCurrentMember(null);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      {/* Members bar — always visible */}
      <MockMembersBar
        currentMember={currentMember}
        onMemberClick={handleMemberClick}
        onTeamClick={handleTeamClick}
      />

      {/* View content */}
      {view === "dashboard" ? (
        <DashboardView onMemberClick={handleMemberClick} />
      ) : currentMember ? (
        <MockSessionView memberName={currentMember} />
      ) : null}
    </div>
  );
}
