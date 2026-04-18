function buildPayload(device, type, value) {
    return `${device}:${type}:${value}`;
}

function randomDevice() {
    const devices = [
        { device: "thermometer", type: "temperature", values: ["20C", "25C", "30C"] },
        { device: "door", type: "status", values: ["open", "closed"] },
        { device: "motionSensor", type: "motion", values: ["detected", "none"] },
        { device: "light", type: "status", values: ["on", "off"] }
    ];

  const d = devices[Math.floor(Math.random() * devices.length)];
  const value = d.values[Math.floor(Math.random() * d.values.length)];

    return buildPayload(d.device, d.type, value);
}

module.exports = {
    buildPayload,
    randomDevice
};