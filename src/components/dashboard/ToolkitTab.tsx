import { useState } from "react";
import { Zap, Anchor, User, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { RepurposerTool } from "./toolkit/RepurposerTool";
import { HookGeneratorTool } from "./toolkit/HookGeneratorTool";
import { BioBuilderTool } from "./toolkit/BioBuilderTool";
import { AngleFinderTool } from "./toolkit/AngleFinderTool";

type Tool = "repurposer" | "hooks" | "bio" | "angles";

const TOOLS: {
  key: Tool;
  icon: React.ReactNode;
  label: string;
  desc: string;
}[] = [
  {
    key: "repurposer",
    icon: <Zap className="h-4 w-4" />,
    label: "Repurposer",
    desc: "Convert one format into another instantly",
  },
  {
    key: "hooks",
    icon: <Anchor className="h-4 w-4" />,
    label: "Hook Generator",
    desc: "10 scroll-stopping hooks from any topic",
  },
  {
    key: "bio",
    icon: <User className="h-4 w-4" />,
    label: "Bio Builder",
    desc: "LinkedIn, Twitter & tagline from 4 answers",
  },
  {
    key: "angles",
    icon: <Compass className="h-4 w-4" />,
    label: "Angle Finder",
    desc: "8 content angles with format suggestions",
  },
];

export const ToolkitTab = () => {
  const [activeTool, setActiveTool] = useState<Tool>("repurposer");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tool selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTool(t.key)}
            className={cn(
              "flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all",
              activeTool === t.key
                ? "bg-primary border-primary text-white shadow-brand"
                : "bg-white border-stone-100 text-stone-600 hover:border-stone-200 shadow-sm",
            )}
          >
            <span
              className={activeTool === t.key ? "text-white" : "text-amber-500"}
            >
              {t.icon}
            </span>
            <span className="font-sans font-semibold text-sm leading-tight">
              {t.label}
            </span>
            <span
              className={cn(
                "font-sans text-[11px] leading-tight",
                activeTool === t.key ? "text-white/70" : "text-stone-400",
              )}
            >
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Active tool */}
      <div>
        {activeTool === "repurposer" && <RepurposerTool />}
        {activeTool === "hooks" && <HookGeneratorTool />}
        {activeTool === "bio" && <BioBuilderTool />}
        {activeTool === "angles" && <AngleFinderTool />}
      </div>
    </div>
  );
};
