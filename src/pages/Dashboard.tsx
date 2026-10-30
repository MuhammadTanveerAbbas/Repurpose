import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { GenerateTab } from "@/components/dashboard/GenerateTab";
import { StatsTab } from "@/components/dashboard/StatsTab";
import { ToolkitTab } from "@/components/dashboard/ToolkitTab";
import { HistoryTab } from "@/components/dashboard/HistoryTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";

type Tab = "stats" | "generate" | "toolkit" | "history" | "settings";

const TABS = [
  { key: "stats", label: "Stats" },
  { key: "generate", label: "Generate" },
  { key: "toolkit", label: "Toolkit" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("stats");

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as Tab)}
      />
      {/* pb-20 on mobile to clear the fixed bottom tab bar */}
      <main className="mx-auto max-w-5xl px-4 py-5 pb-24 sm:px-6 sm:py-6 md:pb-8">
        {activeTab === "generate" && <GenerateTab />}
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "toolkit" && <ToolkitTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
};

export default Dashboard;
