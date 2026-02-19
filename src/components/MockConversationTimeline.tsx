import { useState } from "react";
import {
  User,
  Bot,
  ChevronDown,
  ChevronRight,
  Brain,
  CheckCircle,
  Copy,
  FileEdit,
  Users,
  Cog,
} from "lucide-react";
import { TOOL_STYLES, DEFAULT_TOOL_STYLE } from "../lib/toolStyles";

interface ToolCall {
  name: string;
  input: string;
  output: string;
  status: "success" | "error";
}

interface SubAgentMessage {
  thinking?: string;
  text?: string;
  toolCalls?: ToolCall[];
}

interface SubAgentActivity {
  agentId: string;
  messageCount: number;
  messages: SubAgentMessage[];
}

interface Turn {
  type: "user" | "assistant";
  content?: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  diff?: { file: string; removed: string[]; added: string[] };
  subAgentActivity?: SubAgentActivity;
}

const mockConversation: Turn[] = [
  {
    type: "user",
    content: "Add a dark mode toggle to the settings page",
  },
  {
    type: "assistant",
    thinking:
      "The user wants a dark mode toggle on the settings page. I need to:\n1. Find the settings page component\n2. Check the current theme implementation\n3. Add a toggle switch component\n4. Wire it up to the theme context\n\nLet me start by reading the existing settings page...",
    toolCalls: [
      {
        name: "Read",
        input: "src/components/SettingsPage.tsx",
        output:
          'export function SettingsPage() {\n  return (\n    <div className="p-6">\n      <h1>Settings</h1>\n      <section>\n        <h2>General</h2>\n        {/* settings content */}\n      </section>\n    </div>\n  );\n}',
        status: "success",
      },
      {
        name: "Grep",
        input: 'pattern: "useTheme" — searching for theme hook',
        output:
          "src/hooks/useTheme.ts: export function useTheme()\nsrc/App.tsx: import { useTheme } from './hooks/useTheme'",
        status: "success",
      },
    ],
    content:
      "I found the settings page and the existing theme hook. Let me add the dark mode toggle.",
    diff: {
      file: "src/components/SettingsPage.tsx",
      removed: [
        '      <h2>General</h2>',
        '      {/* settings content */}',
      ],
      added: [
        '      <h2>General</h2>',
        '      <div className="flex items-center justify-between">',
        '        <label>Dark Mode</label>',
        '        <Switch checked={isDark} onCheckedChange={toggleTheme} />',
        '      </div>',
      ],
    },
  },
  {
    type: "assistant",
    thinking:
      "I need to also update the theme context to persist the dark mode preference. Let me have a sub-agent explore the existing storage patterns in the codebase.",
    subAgentActivity: {
      agentId: "a232fb0",
      messageCount: 120,
      messages: [
        {
          text: "I'll conduct a thorough exploration of the theme persistence and storage patterns in this project. Let me start by understanding the project structure.",
          toolCalls: [
            {
              name: "Bash",
              input: "find src/ -name '*.ts' -path '*/hooks/*'",
              output:
                "src/hooks/useTheme.ts\nsrc/hooks/useLocalStorage.ts\nsrc/hooks/useMediaQuery.ts",
              status: "success",
            },
          ],
        },
        {
          text: "Let me get a better understanding of the storage hook:",
          toolCalls: [
            {
              name: "Read",
              input: "src/hooks/useLocalStorage.ts",
              output:
                'export function useLocalStorage<T>(key: string, initial: T) {\n  const [value, setValue] = useState<T>(() => {\n    const stored = localStorage.getItem(key);\n    return stored ? JSON.parse(stored) : initial;\n  });\n  // ...\n}',
              status: "success",
            },
          ],
        },
        {
          thinking:
            "Found the useLocalStorage hook. The useTheme hook should use this to persist the dark mode preference. Let me check if it already does.",
          toolCalls: [
            {
              name: "Read",
              input: "src/hooks/useTheme.ts",
              output:
                'import { useState } from "react";\n\nexport function useTheme() {\n  const [isDark, setIsDark] = useState(false);\n  const toggleTheme = () => setIsDark(!isDark);\n  return { isDark, toggleTheme };\n}',
              status: "success",
            },
          ],
        },
      ],
    },
    content:
      "The sub-agent found that `useTheme` doesn't persist preferences yet. I'll wire it up to `useLocalStorage` so the dark mode setting persists across sessions.",
  },
  {
    type: "assistant",
    toolCalls: [
      {
        name: "Bash",
        input: "bun run test -- --grep 'SettingsPage'",
        output: "✓ SettingsPage renders correctly\n✓ Dark mode toggle changes theme\n✓ Dark mode persists across sessions\n\n3 passed, 0 failed",
        status: "success",
      },
    ],
    content:
      "Done! I've added a dark mode toggle to the settings page with persistence. The toggle uses `useTheme` backed by `useLocalStorage` and all tests pass.",
  },
];

function ToolCallCard({
  tool,
  defaultExpanded = false,
}: {
  tool: ToolCall;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const style = TOOL_STYLES[tool.name] || DEFAULT_TOOL_STYLE;
  const colorClass = style.bg;
  const Icon = style.icon;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="shimmer flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-800/50 transition-colors cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        )}
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          <Icon className="h-3 w-3" />
          {tool.name}
        </span>
        <span className="truncate text-xs text-zinc-400 flex-1">{tool.input}</span>
        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
      </button>
      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/50 px-3 py-2">
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
            {tool.output}
          </pre>
        </div>
      )}
    </div>
  );
}

function ThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="shimmer flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-violet-500/10 transition-colors cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        )}
        <Brain className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-medium text-violet-400">Thinking...</span>
      </button>
      {expanded && (
        <div className="border-t border-violet-500/20 px-3 py-2">
          <pre className="text-xs text-violet-300/70 whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

function SubAgentBlock({ activity }: { activity: SubAgentActivity }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-dashed border-indigo-500/30 bg-indigo-950/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="shimmer flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-500/5 transition-colors cursor-pointer"
      >
        <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span className="text-xs font-medium text-indigo-400">
          Sub-agent activity
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/15 px-1.5 py-0 h-4 text-[10px] font-mono text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          {activity.agentId}
        </span>
        <span className="text-[10px] text-zinc-500">
          ({activity.messageCount} messages)
        </span>
        <span className="ml-auto">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
          )}
        </span>
      </button>

      {open && (
        <div className="border-t border-indigo-500/15 px-3 py-3 space-y-3">
          {activity.messages.map((msg, i) => (
            <div key={i} className="flex gap-0">
              <div className="w-[3px] shrink-0 rounded-full bg-indigo-400" />
              <div className="space-y-2 pl-3 min-w-0 flex-1">
                {msg.thinking && (
                  <div className="flex gap-2 items-start">
                    <Brain className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                    <pre className="text-[11px] text-zinc-500 font-mono whitespace-pre-wrap break-words">
                      {msg.thinking}
                    </pre>
                  </div>
                )}

                {msg.text && (
                  <div className="flex gap-2 items-start">
                    <Cog className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                )}

                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5">
                    {msg.toolCalls.map((tool, j) => (
                      <ToolCallCard key={j} tool={tool} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffView({
  file,
  removed,
  added,
}: {
  file: string;
  removed: string[];
  added: string[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="shimmer flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-800/50 transition-colors cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        )}
        <FileEdit className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-xs font-medium text-zinc-300">{file}</span>
      </button>
      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/80 px-0 py-1 font-mono text-xs leading-relaxed">
          {removed.map((line, i) => (
            <div key={`r-${i}`} className="px-3 py-0.5 bg-red-500/10 text-red-400">
              <span className="text-red-500/50 mr-2">-</span>
              {line}
            </div>
          ))}
          {added.map((line, i) => (
            <div key={`a-${i}`} className="px-3 py-0.5 bg-green-500/10 text-green-400">
              <span className="text-green-500/50 mr-2">+</span>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MockConversationTimeline() {
  return (
    <div className="space-y-1">
      {mockConversation.map((turn, i) => (
        <div key={i} className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
          {/* Turn header */}
          <div className="mb-3 flex items-center gap-2">
            {turn.type === "user" ? (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-blue-400">You</span>
                <span className="text-xs text-zinc-600">turn {i + 1}</span>
              </>
            ) : (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/20">
                  <Bot className="h-3.5 w-3.5 text-green-400" />
                </div>
                <span className="text-sm font-medium text-green-400">Claude</span>
                <span className="text-xs text-zinc-600">turn {i + 1}</span>
              </>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2 pl-8">
            {turn.type === "user" && turn.content && (
              <p className="text-sm text-zinc-200 leading-relaxed">{turn.content}</p>
            )}

            {turn.thinking && <ThinkingBlock content={turn.thinking} />}

            {turn.toolCalls?.map((tool, j) => (
              <ToolCallCard key={j} tool={tool} defaultExpanded={j === 0 && i === 1} />
            ))}

            {turn.subAgentActivity && (
              <SubAgentBlock activity={turn.subAgentActivity} />
            )}

            {turn.diff && (
              <DiffView
                file={turn.diff.file}
                removed={turn.diff.removed}
                added={turn.diff.added}
              />
            )}

            {turn.type === "assistant" && turn.content && (
              <p className="text-sm text-zinc-300 leading-relaxed">{turn.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
