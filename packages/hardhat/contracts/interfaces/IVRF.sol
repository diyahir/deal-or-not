// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IVRF {
    function requestRandomNumber(bytes32 userRandomNumber) external payable returns (bytes32);

    function getRandomNumber(bytes32 requestId) external view returns (uint256);
}
