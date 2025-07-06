// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IVRF {
    function requestRandomNumber(bytes32) external payable returns (uint256);

    function getRandomNumber(uint256 requestId) external returns (uint256);

    function getEntropyFee() external view returns (uint256);
}
