import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000";

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState({
    thermometer: "temp:--",
    door: "closed",
    motion: "idle",
  });

  // 🕒 LIVE TIME FUNCTION
  const getTime = () => {
    const now = new Date();
    return now.toLocaleTimeString(); // HH:MM:SS
  };

  // MOCK API SIMULATION
	useEffect(() => {
  const fetchData = async () => {
    try {
      const logsRes = await fetch(`${API}/logs`);
      const logsData = await logsRes.json();

      const attacksRes = await fetch(`${API}/attacks`);
      const attacksData = await attacksRes.json();

      setLogs(
        logsData.map(
          (l) =>
            `[${new Date(l.timestamp).toLocaleTimeString()}] ✔ ${l.device} → ${l.data}`
        )
      );

     setAlerts(
  (Array.isArray(attacksData) ? attacksData : [])
    .filter((a) => a && a.timestamp)
    .map(
      (a) =>
        `[${new Date(a.timestamp).toLocaleTimeString()}] ❌ ${a.device || "unknown"} → ${a.error || a.type || "attack detected"}`
    )
);
    } catch (err) {
      console.error(err);
    }
  };

  fetchData();
  const interval = setInterval(fetchData, 3000);

  return () => clearInterval(interval);
}, []);

  

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>IoT Security Dashboard</h2>
        <p className="subtitle">Frontend UI Layer</p>
      </div>

      {/* Main */}
      <div className="main">

        {/* DEVICE TABLE */}
        <div className="cards">
          <div className="card">
            🌡 Thermometer
            <span>{devices.thermometer}</span>
          </div>

          <div className="card">
            🚪 Door Sensor
            <span>{devices.door}</span>
          </div>

          <div className="card">
            🚨 Motion Sensor
            <span>{devices.motion}</span>
          </div>
        </div>

        {/* LIVE LOGS */}
        <div className="panel">
          <h3>Live Device Logs</h3>

          <div className="scroll-box">
            {logs.map((log, i) => (
              <div key={i} className="log">{log}</div>
            ))}
          </div>
        </div>

        {/* SECURITY ALERTS */}
        <div className="panel alert">
          <h3>Security Alerts</h3>

          <div className="scroll-box">
            {alerts.length === 0 && (
              <p className="safe">No threats detected</p>
            )}

            {alerts.map((a, i) => (
              <div key={i} className="log">{a}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
