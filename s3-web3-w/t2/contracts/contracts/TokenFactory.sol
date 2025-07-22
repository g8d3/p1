// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PumpFunToken.sol";

contract TokenFactory {
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol
    );

    function createToken(
        string memory name,
        string memory symbol,
        string memory description,
        string memory image
    ) public returns (address) {
        PumpFunToken newToken = new PumpFunToken(
            name,
            symbol,
            description,
            image,
            msg.sender
        );
        emit TokenCreated(
            address(newToken),
            msg.sender,
            name,
            symbol
        );
        return address(newToken);
    }
}