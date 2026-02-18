import { Terminal, FileEdit, FileText, Search } from "lucide-react";

export const TOOL_STYLES: Record<string, { bg: string; icon: typeof Terminal }> = {
  Read: { bg: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: FileText },
  Edit: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: FileEdit },
  Write: { bg: "bg-green-500/20 text-green-400 border-green-500/30", icon: FileEdit },
  Bash: { bg: "bg-red-500/20 text-red-400 border-red-500/30", icon: Terminal },
  Grep: { bg: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Search },
  Glob: { bg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: Search },
  Task: { bg: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: Terminal },
};

export const DEFAULT_TOOL_STYLE = {
  bg: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  icon: Terminal,
};
