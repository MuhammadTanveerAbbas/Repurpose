import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { FadeUp } from "@/components/FadeUp";

const valueData = [
  { label: "Free", drafts: 5, display: "5" },
  { label: "Creator", drafts: 20, display: "Unlimited" },
  { label: "Pro", drafts: 20, display: "Unlimited" },
];

const radarData = [
  { feature: "Formats", free: 100, creator: 100, pro: 100 },
  { feature: "Inputs", free: 100, creator: 100, pro: 100 },
  { feature: "Generations", free: 20, creator: 100, pro: 100 },
  { feature: "Exports", free: 60, creator: 80, pro: 100 },
  { feature: "History", free: 0, creator: 0, pro: 100 },
];

export const PricingCharts = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-80px" });

  return (
    <section className="bg-white border-t border-stone-200" ref={chartRef}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
        <FadeUp>
          <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">
            Value at a glance
          </p>
          <h2 className="font-display text-3xl text-stone-900 mb-3">
            See what you get
          </h2>
          <p className="font-sans text-sm text-stone-500 mb-12 max-w-lg leading-relaxed">
            A quick visual breakdown of generations per month and feature coverage
            across plans.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={chartInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl bg-background border border-stone-100 p-6"
          >
            <p className="font-sans text-sm font-semibold text-stone-800 mb-1">
              Max generations per month
            </p>
            <p className="font-sans text-xs text-stone-400 mb-6">
              Generations per month by plan
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={valueData}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                barSize={44}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EDE8E0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                    fill: "#A8A29E",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#A8A29E",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E7E0D8",
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                  labelStyle={{ color: "#57534E", fontWeight: 600 }}
                  formatter={(_v: number, _name: string, item: { payload?: { display?: string } }) => [
                    `${item.payload?.display ?? _v} generations`,
                    "Max/month",
                  ]}
                  cursor={{ fill: "rgba(232,116,58,0.05)" }}
                />
                <Bar
                  dataKey="drafts"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={chartInView}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {valueData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.label === "Free"
                          ? "#D1C4B0"
                          : entry.label === "Creator"
                            ? "#E8743A"
                            : "#D4632A"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="font-sans text-xs text-stone-400 mt-3 text-center">
              Free: 5 generations/mo &nbsp;|&nbsp; Creator & Pro: unlimited
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={chartInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl bg-background border border-stone-100 p-6"
          >
            <p className="font-sans text-sm font-semibold text-stone-800 mb-1">
              Feature coverage by plan
            </p>
            <p className="font-sans text-xs text-stone-400 mb-4">
              Relative score across key dimensions (illustrative)
            </p>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart
                data={radarData}
                margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
              >
                <PolarGrid stroke="#E7E0D8" />
                <PolarAngleAxis
                  dataKey="feature"
                  tick={{
                    fontSize: 11,
                    fill: "#A8A29E",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                />
                <Radar
                  name="Free"
                  dataKey="free"
                  stroke="#D1C4B0"
                  fill="#D1C4B0"
                  fillOpacity={0.25}
                  isAnimationActive={chartInView}
                  animationDuration={1000}
                />
                <Radar
                  name="Creator"
                  dataKey="creator"
                  stroke="#E8743A"
                  fill="#E8743A"
                  fillOpacity={0.3}
                  isAnimationActive={chartInView}
                  animationDuration={1200}
                />
                <Radar
                  name="Pro"
                  dataKey="pro"
                  stroke="#D4632A"
                  fill="#D4632A"
                  fillOpacity={0.15}
                  isAnimationActive={chartInView}
                  animationDuration={1400}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E7E0D8",
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-5 mt-2">
              {[
                { label: "Free", color: "#D1C4B0" },
                { label: "Creator", color: "#E8743A" },
                { label: "Pro", color: "#D4632A" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: l.color }}
                  />
                  <span className="font-sans text-xs text-stone-500">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
