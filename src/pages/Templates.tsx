import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const templates = [
  { id: "1", niche: "B2B SaaS", title: "Product Launch Announcement", snippet: "We just shipped something big. Here's why it matters for [industry]…", tone: "professional" },
  { id: "2", niche: "B2B SaaS", title: "Customer Success Story", snippet: "3 months ago, [company] was struggling with [problem]. Today, they…", tone: "professional" },
  { id: "3", niche: "Personal Finance", title: "Money Myth Debunker", snippet: "Everyone says [common advice]. But here's what the data shows…", tone: "casual" },
  { id: "4", niche: "Personal Finance", title: "Weekly Market Digest", snippet: "This week in markets: 3 things you need to know…", tone: "professional" },
  { id: "5", niche: "Fitness", title: "Workout Breakdown", snippet: "I've tested this routine for 90 days. Here's my honest review…", tone: "casual" },
  { id: "6", niche: "Fitness", title: "Nutrition Science Simplified", snippet: "The science behind [topic] in 60 seconds. No bro-science…", tone: "punchy" },
  { id: "7", niche: "Marketing", title: "Campaign Teardown", snippet: "This brand just went viral. Here's the exact playbook they used…", tone: "punchy" },
  { id: "8", niche: "Marketing", title: "Content Strategy Template", snippet: "Stop posting random content. Here's a framework that drives…", tone: "professional" },
  { id: "9", niche: "Dev Education", title: "Tutorial Recap", snippet: "I just built [project] from scratch. Here are the 5 key takeaways…", tone: "casual" },
  { id: "10", niche: "Dev Education", title: "Tool Comparison", snippet: "[Tool A] vs [Tool B]: I tested both. The winner surprised me…", tone: "casual" },
  { id: "11", niche: "Marketing", title: "Trend Analysis", snippet: "3 trends that will define [industry] in 2026. #2 is already happening…", tone: "punchy" },
  { id: "12", niche: "Dev Education", title: "Code Review Insights", snippet: "I reviewed 50 PRs this month. The 3 most common mistakes…", tone: "professional" },
];

const niches = ["All", ...Array.from(new Set(templates.map(t => t.niche)))];

const Templates = () => {
  const navigate = useNavigate();
  const [activeNiche, setActiveNiche] = useState("All");

  const filtered = activeNiche === "All" ? templates : templates.filter(t => t.niche === activeNiche);

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-2">Templates</p>
          <h1 className="font-display text-2xl sm:text-3xl text-stone-900 mb-1">Content templates</h1>
          <p className="font-sans text-sm text-stone-400">Pre-built prompt styles for different niches</p>
        </div>

        {/* Niche filter */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {niches.map(n => (
            <button
              key={n}
              onClick={() => setActiveNiche(n)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors font-sans",
                activeNiche === n
                  ? "bg-[#E8743A] text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="group rounded-2xl border border-stone-100 bg-white p-5 hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone-400">{t.niche}</span>
                <span className="font-sans text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">{t.tone}</span>
              </div>
              <h3 className="font-display text-sm font-semibold text-stone-900 mb-2">{t.title}</h3>
              <p className="font-sans text-sm text-stone-500 flex-1 mb-4 leading-relaxed">"{t.snippet}"</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 font-sans"
                onClick={() => navigate("/project/new")}
              >
                Use template
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Templates;
