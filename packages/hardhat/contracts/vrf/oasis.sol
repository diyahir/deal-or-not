// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../interfaces/IVRF.sol";
// solhint-disable-next-line
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract OasisVRF is IVRF {
    /**
     * @dev Request a random number using Oasis's Sapphire VRF
     * @param _userRandomNumber Additional entropy from user (can be used for extra randomness)
     * @return requestId The unique identifier for this random number request
     */
    function requestRandomNumber(bytes32 _userRandomNumber) external payable override returns (uint256) {
        // For Oasis Sapphire, we can generate random numbers directly
        // This function is required by the interface but we return 0 as we don't need request tracking
        return 0;
    }

    /**
     * @dev Get a random number using Oasis's Sapphire secure randomness
     * @param requestId The request ID (unused in this implementation)
     * @return The random number from Oasis's Sapphire VRF
     */
    function getRandomNumber(uint256 requestId) external view override returns (uint256) {
        // requestId is unused in this implementation but required by interface
        return uint256(bytes32(Sapphire.randomBytes(32, "")));
    }
}
