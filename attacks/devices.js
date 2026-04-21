const DEVICE_DEFS = {
  thermometer: {
    type: "temp",
    values: ["20C", "25C", "30C", "35C"]
  },
  "Air-Conditioner": {
    type: "state",
    values: ["ON", "OFF"]
  },
  "motion-sensor": {
    type: "motion",
    values: ["DETECTED", "IDLE"]
  },
  camera: {
    type: "mode",
    values: ["ON", "OFF", "RECORDING"]
  },
  "alarm-system": {
    type: "state",
    values: ["ARMED", "DISARMED", "TRIGGERED"]
  }
};

function buildPayload(device, type, value) {
  return `${type}:${value}`;
}

function buildStructured(device, type, value) {
  return {
    device,
    type,
    value,
    payload: buildPayload(device, type, value)
  };
}

function randomDevice() {
  const names = Object.keys(DEVICE_DEFS);
  const device = names[Math.floor(Math.random() * names.length)];
  const def = DEVICE_DEFS[device];
  const value = def.values[Math.floor(Math.random() * def.values.length)];

  return buildStructured(device, def.type, value);
}

module.exports = {
  DEVICE_DEFS,
  buildPayload,
  buildStructured,
  randomDevice
};
