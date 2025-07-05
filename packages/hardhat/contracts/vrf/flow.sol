// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../interfaces/IVRF.sol";
import {CadenceRandomConsumer} from "@onflow/flow-sol-utils/src/random/CadenceRandomConsumer.sol";

/**
 * @dev Flow VRF implementation using Flow's native secure randomness
 * Implements the IVRF interface for compatibility with DealOrNot contract
 */
contract FlowVRF is IVRF, CadenceRandomConsumer {
    event RandomRequested(bytes32 indexed requestId, uint256 indexed flowRequestId);
    event RandomFulfilled(bytes32 indexed requestId, uint256 randomNumber);

    /**
     * @dev Request a random number using Flow's native VRF
     * @param _userRandomNumber Additional entropy from user (can be used for extra randomness)
     * @return requestId The unique identifier for this random number request
     */
    function requestRandomNumber(bytes32 _userRandomNumber) external payable override returns (uint256) {
        // Generate a unique request ID
        // Request randomness from Flow's native VRF
        uint256 flowRequestId = _requestRandomness();

        return flowRequestId;
    }

    /**
     * @dev Get the random number for a request
     * @param requestId The request ID returned by requestRandomNumber
     * @return The random number from Flow's VRF
     */
    function getRandomNumber(uint256 requestId) external override returns (uint256) {
        uint256 randomNumber = _fulfillRandomInRange(requestId, 0, type(uint64).max);

        return randomNumber;
    }
}
