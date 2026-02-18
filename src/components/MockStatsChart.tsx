const tokenData = [
  { turn: 1, input: 1200, output: 800, cacheRead: 400 },
  { turn: 2, input: 3400, output: 2100, cacheRead: 1800 },
  { turn: 3, input: 2800, output: 1500, cacheRead: 2200 },
  { turn: 4, input: 4100, output: 3200, cacheRead: 3600 },
  { turn: 5, input: 1900, output: 900, cacheRead: 1200 },
  { turn: 6, input: 5200, output: 4100, cacheRead: 4800 },
  { turn: 7, input: 3100, output: 1800, cacheRead: 2900 },
  { turn: 8, input: 2400, output: 1200, cacheRead: 2000 },
];

const toolBreakdown = [
  { name: "Edit", count: 12, color: "#f59e0b" },
  { name: "Read", count: 8, color: "#3b82f6" },
  { name: "Bash", count: 6, color: "#ef4444" },
  { name: "Grep", count: 5, color: "#a855f7" },
  { name: "Write", count: 3, color: "#22c55e" },
  { name: "Glob", count: 2, color: "#06b6d4" },
];

const maxTokens = Math.max(...tokenData.map((d) => d.input + d.output));
const maxTool = Math.max(...toolBreakdown.map((t) => t.count));

// Activity heatmap data (7 days × 24 hours)
const heatmapData: number[][] = Array.from({ length: 7 }, () =>
  Array.from({ length: 24 }, () => Math.random() > 0.6 ? Math.floor(Math.random() * 10) : 0)
);

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MockStatsChart() {
  const totalInput = tokenData.reduce((s, d) => s + d.input, 0);
  const totalOutput = tokenData.reduce((s, d) => s + d.output, 0);
  const totalCache = tokenData.reduce((s, d) => s + d.cacheRead, 0);
  const estimatedCost = ((totalInput * 3 + totalOutput * 15 + totalCache * 0.3) / 1_000_000).toFixed(4);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Input Tokens", value: totalInput.toLocaleString(), color: "text-blue-400" },
          { label: "Output Tokens", value: totalOutput.toLocaleString(), color: "text-green-400" },
          { label: "Cache Read", value: totalCache.toLocaleString(), color: "text-amber-400" },
          { label: "Est. Cost", value: `$${estimatedCost}`, color: "text-emerald-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-xs text-zinc-500">{card.label}</div>
            <div className={`text-lg font-semibold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Token usage chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h4 className="mb-3 text-sm font-medium text-zinc-300">Tokens per Turn</h4>
        <svg viewBox="0 0 400 140" className="w-full">
          {tokenData.map((d, i) => {
            const x = i * 48 + 20;
            const inputH = (d.input / maxTokens) * 100;
            const outputH = (d.output / maxTokens) * 100;
            return (
              <g key={i}>
                <rect x={x} y={120 - inputH} width={16} height={inputH} rx={2} fill="#3b82f6" opacity={0.8} />
                <rect x={x + 18} y={120 - outputH} width={16} height={outputH} rx={2} fill="#22c55e" opacity={0.8} />
                <text x={x + 16} y={135} textAnchor="middle" className="text-[9px]" fill="#71717a">
                  T{d.turn}
                </text>
              </g>
            );
          })}
          {/* Legend */}
          <rect x={310} y={5} width={8} height={8} rx={1} fill="#3b82f6" />
          <text x={322} y={12} className="text-[9px]" fill="#a1a1aa">Input</text>
          <rect x={310} y={18} width={8} height={8} rx={1} fill="#22c55e" />
          <text x={322} y={25} className="text-[9px]" fill="#a1a1aa">Output</text>
        </svg>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tool call breakdown */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h4 className="mb-3 text-sm font-medium text-zinc-300">Tool Calls</h4>
          <div className="space-y-2">
            {toolBreakdown.map((tool) => (
              <div key={tool.name} className="flex items-center gap-3">
                <span className="w-10 text-xs text-zinc-400 text-right">{tool.name}</span>
                <div className="flex-1 h-4 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(tool.count / maxTool) * 100}%`,
                      backgroundColor: tool.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="w-6 text-xs text-zinc-500 text-right">{tool.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h4 className="mb-3 text-sm font-medium text-zinc-300">Activity</h4>
          <div className="space-y-1">
            {heatmapData.map((row, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-1">
                <span className="w-7 text-[9px] text-zinc-500">{days[dayIdx]}</span>
                <div className="flex gap-0.5">
                  {row.map((val, hourIdx) => (
                    <div
                      key={hourIdx}
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        backgroundColor:
                          val === 0
                            ? "#18181b"
                            : `rgba(59, 130, 246, ${Math.min(val / 8, 1) * 0.8 + 0.2})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
