// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../interfaces/IVRF.sol";
// solhint-disable-next-line
import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
// solhint-disable-next-line
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/RandomNumberV2Interface.sol";

/**
 * @dev Flare VRF implementation using Flare's native secure randomness
 * Implements the IVRF interface for compatibility with DealOrNot contract
 */
contract FlareVRF is IVRF {
    RandomNumberV2Interface internal randomV2;

    /**
     * Initializing an instance with RandomNumberV2Interface.
     * The contract registry is used to fetch the contract address.
     */
    constructor() {
        randomV2 = ContractRegistry.getRandomNumberV2();
    }

    /**
     * @dev Request a random number using Flare's native VRF
     * @param _userRandomNumber Additional entropy from user (can be used for extra randomness)
     * @return requestId The unique identifier for this random number request
     */
    function requestRandomNumber(bytes32 _userRandomNumber) external payable override returns (uint256) {
        // This is an unused function, but it is required by the IVRF interface
        return 0;
    }

    /**
     * @dev Get the random number for a request
     * @param requestId The request ID returned by requestRandomNumber
     * @return The random number from Flare's VRF combined with request-specific entropy
     */
    function getRandomNumber(uint256 requestId) external override returns (uint256) {
        // Request ID is unused, but it is required by the IVRF interface
        uint256 flareRandomNumber = _getSecureRandomNumber();

        return flareRandomNumber;
    }

    /**
     * Fetch the latest secure random number from Flare.
     * The random number is generated every 90 seconds.
     */
    function _getSecureRandomNumber() public view returns (uint256 randomNumber) {
        bool isSecure;
        uint256 timestamp;
        (randomNumber, isSecure, timestamp) = randomV2.getRandomNumber();
        /* DO NOT USE THE RANDOM NUMBER IF isSecure=false. */
        require(isSecure, "Random number is not secure");
        return randomNumber;
    }
}
