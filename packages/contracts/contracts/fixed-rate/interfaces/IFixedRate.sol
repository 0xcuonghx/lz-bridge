// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

struct SendParam {
    uint32 dstEid; // Destination endpoint ID.
    bytes32 to; // Recipient address.
    uint256 amount; // TokenId Amount to send in local decimals.
    bytes extraOptions; // Additional options supplied by the caller to be used in the LayerZero message.
}

interface IFixedRate {}
