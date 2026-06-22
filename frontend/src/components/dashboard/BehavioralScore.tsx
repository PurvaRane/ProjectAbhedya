const score = 92;
const circumference = 2 * Math.PI * 52;
const offset = circumference - (score / 100) * circumference;

const metrics = [
  { label: "Typing Pattern", score: 94, desc: "Consistent keystroke timing detected" },
  { label: "Login Consistency", score: 96, desc: "Login times match historical pattern" },
  { label: "Device Consistency", score: 98, desc: "Recognized device and fingerprint" },
  { label: "Session Behavior", score: 89, desc: "Navigation patterns within normal range" },
  { label: "Navigation Behavior", score: 85, desc: "Click & scroll patterns are human-like" },
];

const getScoreColor = (s: number) =>
  s >= 85 ? "text-green-600" : s >= 65 ? "text-amber-600" : "text-red-600";

const getBarColor = (s: number) =>
  s >= 85 ? "bg-green-500" : s >= 65 ? "bg-amber-500" : "bg-red-500";

const getRiskLabel = (s: number) =>
  s >= 85 ? { label: "High Confidence", badge: "badge-verified" }
  : s >= 65 ? { label: "Medium Confidence", badge: "badge-warning" }
  : { label: "Low Confidence — Alert", badge: "badge-danger" };

const risk = getRiskLabel(score);

const trendData = [78, 82, 85, 88, 91, 87, 92];
const maxVal = Math.max(...trendData);

export default function BehavioralScore() {
  return (
    <div>
      <h2 className="section-heading">Behavioral Confidence Scoring</h2>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Circular Score Widget */}
        <div className="dash-card flex flex-col items-center py-8">
          <h3 className="font-bold text-canara-blue mb-6">Behavioral Score</h3>
          <div className="relative flex items-center justify-center">
            <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
              {/* Track */}
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="10"
              />
              {/* Progress */}
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="#004792"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold text-canara-blue">{score}%</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Score</span>
            </div>
          </div>
          <span className={`mt-4 ${risk.badge}`}>{risk.label}</span>
          <p className="mt-2 text-xs text-center text-gray-500">
            Based on 5 behavioral factors analyzed in real-time
          </p>
          <div className="mt-4 w-full border-t border-gray-100 pt-4 space-y-2">
            {[
              { label: "Current Score", value: `${score}%` },
              { label: "7-Day Average", value: "86.1%" },
              { label: "Risk Level", value: "Low Risk" },
              { label: "Last Updated", value: "Real-time" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{s.label}</span>
                <span className="font-bold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Breakdown */}
        <div className="dash-card lg:col-span-2">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Behavioral Metrics</h3>
            <span className="text-xs text-gray-400">Real-time analysis</span>
          </div>
          <div className="space-y-5">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.desc}</p>
                  </div>
                  <span className={`text-base font-bold ${getScoreColor(m.score)}`}>{m.score}%</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${getBarColor(m.score)}`}
                    style={{ width: `${m.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Trend */}
      <div className="dash-card mb-6">
        <div className="dash-card-header">
          <h3 className="font-bold text-canara-blue">7-Day Score Trend</h3>
          <span className="badge-verified">↑ Trending Up</span>
        </div>
        <div className="flex items-end gap-2 h-32 px-4">
          {trendData.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-canara-blue">{val}%</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${(val / maxVal) * 80}px`,
                  background: i === trendData.length - 1
                    ? "linear-gradient(to top, #004792, #005DAC)"
                    : "#E5E7EB",
                }}
              ></div>
              <span className="text-xs text-gray-400">D-{trendData.length - 1 - i || "0"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Indicator Legend */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="font-bold text-canara-blue">Risk Level Reference</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { range: "85–100%", level: "High Confidence", desc: "Normal behavior. No action required.", badge: "badge-verified", border: "border-green-200 bg-green-50" },
            { range: "65–84%", level: "Medium Confidence", desc: "Minor deviation. Monitor closely.", badge: "badge-warning", border: "border-amber-200 bg-amber-50" },
            { range: "0–64%", level: "Low Confidence", desc: "Unusual behavior. Alert triggered.", badge: "badge-danger", border: "border-red-200 bg-red-50" },
          ].map((item) => (
            <div key={item.range} className={`rounded-xl border ${item.border} p-4`}>
              <span className={item.badge}>{item.level}</span>
              <p className="mt-2 text-2xl font-bold text-gray-700">{item.range}</p>
              <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
