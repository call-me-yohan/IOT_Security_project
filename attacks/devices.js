function buildPayload(device, type, value) {
    return `${type}:${value}`;
}

function buildStructured(device, type, value) {
    return {
        device,
        type,
        value,
        payload: `${type}:${value}`
    };
}

function randomDevice() {
    const devices = [
        { device: "thermometer", type: "temp", values: ["20C", "25C", "30C"] },
        { device: "Air-Conditioner", type: "temp", values: ["18C", "22C"] },
        { device: "humiditySensor", type: "humidity", values: ["50%", "60%"] }
    ];

    const d = devices[Math.floor(Math.random() * devices.length)];
    const value = d.values[Math.floor(Math.random() * d.values.length)];

    return buildStructured(d.device, d.type, value);
}

module.exports = {
    buildPayload,
    buildStructured,
    randomDevice
};