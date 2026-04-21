import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000";

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${url} returned non-JSON: ${text}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `${url} failed with status ${res.status}`);
  }

  return data;
};

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState({
    thermometer: "temp:--",
    "Air-Conditioner": "state:--",
  });

  const [selectedDevice, setSelectedDevice] = useState("thermometer");
  const [temperatureValue, setTemperatureValue] = useState("25");
  const [acState, setAcState] = useState("ON");
  const [sendStatus, setSendStatus] = useState("");

const fetchData = async () => {
  const [logsResult, attacksResult, devicesResult] = await Promise.allSettled([
    fetchJson(`${API}/logs`),
    fetchJson(`${API}/attacks`),
    fetchJson(`${API}/devices`)
  ]);

  if (logsResult.status === "fulfilled") {
    const logsData = logsResult.value;

    setLogs(
      (Array.isArray(logsData) ? logsData : [])
        .filter((l) => l && l.timestamp && l.device && l.data)
        .slice()
        .reverse()
        .map(
          (l) =>
            `[${new Date(l.timestamp).toLocaleTimeString()}] ✔ ${l.device} → ${l.data}`
        )
    );
  } else {
    console.error("Logs fetch failed:", logsResult.reason);
  }

  if (attacksResult.status === "fulfilled") {
    const attacksData = attacksResult.value;

    setAlerts(
      (Array.isArray(attacksData) ? attacksData : [])
        .filter((a) => a && a.timestamp)
        .slice()
        .reverse()
        .map(
          (a) =>
            `[${new Date(a.timestamp).toLocaleTimeString()}] ❌ ${a.device || "unknown"} → ${a.error || a.type || "attack detected"}`
        )
    );
  } else {
    console.error("Attacks fetch failed:", attacksResult.reason);
  }

  if (devicesResult.status === "fulfilled") {
    const devicesData = devicesResult.value;

    setDevices({
      thermometer: devicesData?.thermometer || "temp:--",
      "Air-Conditioner": devicesData?.["Air-Conditioner"] || "state:--",
    });
  } else {
    console.error("Devices fetch failed:", devicesResult.reason);
  }
};

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const buildPayload = () => {
    if (selectedDevice === "thermometer") {
      return `temp:${temperatureValue}C`;
    }

    if (selectedDevice === "Air-Conditioner") {
      return `state:${acState}`;
    }

    return "";
  };

  const handleSend = async (e) => {
  e.preventDefault();
  setSendStatus("");

  const payload = buildPayload();

  try {
    await fetchJson(`${API}/send-by-device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device: selectedDevice,
        payload,
      }),
    });

    setSendStatus(`✅ Sent: ${selectedDevice} → ${payload}`);
    await fetchData();
  } catch (err) {
    console.error("Send failed:", err);
    setSendStatus(`❌ ${err.message}`);
  }
};

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>IoT Security Dashboard</h2>
        <p className="subtitle">Frontend UI Layer</p>
      </div>

      <div className="main">
        <div className="cards">
          <div className="card">
            🌡 Thermometer
            <span>{devices.thermometer}</span>
          </div>

          <div className="card">
            ❄️ Air-Conditioner
            <span>{devices["Air-Conditioner"]}</span>
          </div>
        </div>

        <div className="panel">
          <h3>Send Device Message</h3>

          <form className="send-form" onSubmit={handleSend}>
            <label>
              Device
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                <option value="thermometer">thermometer</option>
                <option value="Air-Conditioner">Air-Conditioner</option>
              </select>
            </label>

            {selectedDevice === "thermometer" && (
              <label>
                Temperature
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={temperatureValue}
                  onChange={(e) => setTemperatureValue(e.target.value)}
                />
              </label>
            )}

            {selectedDevice === "Air-Conditioner" && (
              <label>
                State
                <select value={acState} onChange={(e) => setAcState(e.target.value)}>
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>
              </label>
            )}

            <button type="submit">Send Message</button>
          </form>

          <p className="send-status">{sendStatus}</p>
        </div>

        <div className="panel">
          <h3>Live Device Logs</h3>

          <div className="scroll-box">
            {logs.length === 0 && <p className="safe">No logs yet</p>}

            {logs.map((log, i) => (
              <div key={i} className="log">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="panel alert">
          <h3>Security Alerts</h3>

          <div className="scroll-box">
            {alerts.length === 0 && <p className="safe">No threats detected</p>}

            {alerts.map((a, i) => (
              <div key={i} className="log">
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
