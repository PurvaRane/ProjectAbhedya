import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api/client";

type FraudRingUser = {
  user_id: string;
  name: string;
  email: string;
  risk_score: number;
  is_active: boolean;
};

export default function FraudRings() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<FraudRingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFraudRings();
  }, []);

  const fetchFraudRings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/analyst/fraud/rings/analyze`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch fraud rings");
      const data = await res.json();
      setUsers(data.fraud_rings || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const highRiskUsers = users.filter(u => u.risk_score > 0.5);
  const lowRiskUsers = users.filter(u => u.risk_score <= 0.5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-heading mb-0">Network Fraud Rings (GNN)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Heterogeneous Graph Neural Network detecting organized fraud clusters across devices, IPs, and visual templates.
          </p>
        </div>
        <button onClick={fetchFraudRings} className="btn-sm-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Re-Analyze Graph
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-red-700">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-canara-gold border-t-transparent mb-4"></div>
            <p className="text-sm text-gray-500 font-semibold">Propagating Graph Convolutions...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          
          <div className="dash-card">
            <div className="dash-card-header border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-red-500"></span>
                <h3 className="font-bold text-red-700">High Risk Network Clusters</h3>
              </div>
              <span className="badge-danger">{highRiskUsers.length} Users</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {highRiskUsers.map(user => (
                <div key={user.user_id} className="p-3 rounded-lg border border-red-200 bg-red-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">{user.name}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-1">{user.user_id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-red-600">{user.risk_score.toFixed(3)}</div>
                    <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Network Risk</div>
                  </div>
                </div>
              ))}
              {highRiskUsers.length === 0 && (
                <div className="text-sm text-gray-500 py-4 text-center">No high-risk users detected in the network graph.</div>
              )}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
                <h3 className="font-bold text-green-700">Isolated / Safe Users</h3>
              </div>
              <span className="badge-verified">{lowRiskUsers.length} Users</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {lowRiskUsers.map(user => (
                <div key={user.user_id} className="p-3 rounded-lg border border-green-200 bg-green-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">{user.name}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{user.risk_score.toFixed(3)}</div>
                  </div>
                </div>
              ))}
              {lowRiskUsers.length === 0 && (
                <div className="text-sm text-gray-500 py-4 text-center">No isolated users found.</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
