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
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as Tab)}
      />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
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
