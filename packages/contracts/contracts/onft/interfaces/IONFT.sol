// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { MessagingReceipt, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";

struct SendParam {
    uint32 dstEid; // Destination endpoint ID.
    bytes32 to; // Recipient address.
    uint256 tokenId; // TokenId Amount to send in local decimals.
    bytes extraOptions; // Additional options supplied by the caller to be used in the LayerZero message.
}

struct ONFTReceipt {
    uint256 tokenId; // Amount of tokens ACTUALLY debited from the sender in local decimals.
}

interface IONFT {
    // Custom error messages

    // Events
    event ONFTSent(
        bytes32 indexed guid, // GUID of the OFT message.
        uint32 dstEid, // Destination Endpoint ID.
        address indexed fromAddress, // Address of the sender on the src chain.
        uint256 tokenId // TokenId of tokens sent in local decimals.
    );
    event ONFTReceived(
        bytes32 indexed guid, // GUID of the OFT message.
        uint32 srcEid, // Source Endpoint ID.
        address indexed toAddress, // Address of the recipient on the dst chain.
        uint256 tokenId // TokenId of tokens sent in local decimals.
    );

    function onftVersion() external view returns (bytes4 interfaceId, uint64 version);

    function token() external view returns (address);

    function approvalRequired() external view returns (bool);

    function quoteSend(SendParam calldata _sendParam, bool _payInLzToken) external view returns (MessagingFee memory);

    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable returns (MessagingReceipt memory, ONFTReceipt memory);
}
