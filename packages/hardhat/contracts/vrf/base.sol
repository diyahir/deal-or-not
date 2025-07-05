// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../interfaces/IVRF.sol";

// This is a base VRF contract that uses the block.timestamp, block.prevrandao, and blockhash to generate a random number.
// It is not secure and should not be used in production.

contract BaseVRF is IVRF {
    uint256 private nonce = 0;

    function requestRandomNumber(bytes32 userId) external payable returns (uint256) {
        nonce++;
        uint256 randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp, block.prevrandao, userId, blockhash(block.number - 2), tx.origin, nonce, msg.sender
                )
            )
        );
        return randomSeed;
    }

    function getRandomNumber(uint256 requestId) external view returns (uint256) {
        uint256 randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    requestId,
                    blockhash(block.number - 1),
                    tx.origin,
                    msg.sender,
                    gasleft()
                )
            )
        );

        return randomSeed;
    }
}
