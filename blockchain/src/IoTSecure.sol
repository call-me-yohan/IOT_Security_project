// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IoTSecure {
    mapping(address => bool) public registered;
    mapping(address => uint256) public nonces;

    event DeviceRegistered(address device);
    event MessageAccepted(address device, string payload);
    event MessageRejected(address device);

    function registerDevice(address device) external {
        registered[device] = true;
        emit DeviceRegistered(device);
    }

    function sendMessage(
        string calldata payload,
        uint256 nonce
    ) external {
        if (!registered[msg.sender]) {
            emit MessageRejected(msg.sender);
            revert("Not registered");
        }

        require(nonce == nonces[msg.sender], "Replay attack detected");

        nonces[msg.sender]++;

        emit MessageAccepted(msg.sender, payload);
    }
}
