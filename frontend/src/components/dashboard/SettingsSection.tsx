import { useState } from "react";

type ToggleProps = {
  checked: boolean;
  onChange: () => void;
  id: string;
};

function Toggle({ checked, onChange, id }: ToggleProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-canara-blue focus:ring-offset-2 ${
        checked ? "bg-canara-blue" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsSection() {
  const [notifs, setNotifs] = useState({
    loginAlerts: true,
    failedAttempts: true,
    mfaReminders: true,
    sessionExpiry: false,
    weeklyReport: true,
    deviceTrust: false,
  });

  const [sessionTimeout, setSessionTimeout] = useState(30);

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const notifItems = [
    { key: "loginAlerts" as const, label: "Login Alerts", desc: "Receive a notification on every successful login." },
    { key: "failedAttempts" as const, label: "Failed Login Attempts", desc: "Alert when a login attempt fails for your account." },
    { key: "mfaReminders" as const, label: "MFA Verification Reminders", desc: "Remind to complete MFA if not done within 10 minutes." },
    { key: "sessionExpiry" as const, label: "Session Expiry Warnings", desc: "Notify 5 minutes before your session expires." },
    { key: "weeklyReport" as const, label: "Weekly Security Report", desc: "Receive a weekly summary of your account security events." },
    { key: "deviceTrust" as const, label: "New Device Trust Requests", desc: "Alert when a new device attempts to authenticate." },
  ];

  return (
    <div>
      <h2 className="section-heading">Settings</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notification Preferences */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="font-bold text-canara-blue">Notification Preferences</h3>
            <span className="badge-info">{Object.values(notifs).filter(Boolean).length} Active</span>
          </div>
          <div className="space-y-4">
            {notifItems.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <Toggle
                  id={`notif-${item.key}`}
                  checked={notifs[item.key]}
                  onChange={() => toggleNotif(item.key)}
                />
              </div>
            ))}
          </div>
          <button className="btn-primary w-full mt-4">Save Preferences</button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Session Timeout */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="font-bold text-canara-blue">Session Timeout</h3>
              <span className="badge-info">{sessionTimeout} min</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Set how long your session remains active without interaction before automatic logout.
            </p>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-full accent-canara-blue"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 min</span>
              <span className="font-bold text-canara-blue">{sessionTimeout} min</span>
              <span>120 min</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[15, 30, 60, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => setSessionTimeout(t)}
                  className={`rounded-lg py-2 text-xs font-bold transition ${
                    sessionTimeout === t ? "bg-canara-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t}m
                </button>
              ))}
            </div>
            <button className="btn-secondary w-full mt-4">Apply Timeout Setting</button>
          </div>

          {/* Security Preferences */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="font-bold text-canara-blue">Security Preferences</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Require MFA on every login", checked: true },
                { label: "Lock account after 5 failed attempts", checked: true },
                { label: "Auto-logout on browser close", checked: false },
                { label: "Enforce trusted devices only", checked: false },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <input
                    type="checkbox"
                    defaultChecked={pref.checked}
                    className="h-4 w-4 rounded accent-canara-blue"
                  />
                  <span className="text-sm text-gray-700">{pref.label}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full mt-4">Save Security Settings</button>
          </div>

          {/* Danger Zone */}
          <div className="dash-card border-red-200">
            <div className="dash-card-header">
              <h3 className="font-bold text-red-600">Danger Zone</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">These actions are irreversible. Proceed with caution.</p>
            <div className="flex flex-col gap-3">
              <button className="btn-sm-danger w-full justify-center py-2.5 text-sm">Revoke All Active Sessions</button>
              <button className="btn-sm-danger w-full justify-center py-2.5 text-sm">Reset All MFA Devices</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
