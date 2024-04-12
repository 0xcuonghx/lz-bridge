// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { OApp, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OAppPreCrimeSimulator } from "@layerzerolabs/lz-evm-oapp-v2/contracts/precrime/OAppPreCrimeSimulator.sol";
import { OAppOptionsType3 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { IOAppMsgInspector } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppMsgInspector.sol";

import { IONFT, SendParam, MessagingFee, MessagingReceipt, ONFTReceipt } from "./interfaces/IONFT.sol";
import { ONFTMsgCodec } from "./libs/ONFTMsgCodec.sol";

abstract contract ONFTCore is IONFT, OApp, OAppPreCrimeSimulator, OAppOptionsType3 {
    using ONFTMsgCodec for bytes;
    using ONFTMsgCodec for bytes32;

    // @notice Msg types that are used to identify the various OFT operations.
    // @dev This can be extended in child contracts for non-default oft operations
    // @dev These values are used in things like combineOptions() in OAppOptionsType3.sol.
    uint16 public constant SEND = 1;

    // Address of an optional contract to inspect both 'message' and 'options'
    address public msgInspector;
    event MsgInspectorSet(address inspector);

    constructor(address _endpoint, address _delegate) OApp(_endpoint, _delegate) {}

    function onftVersion() external pure virtual returns (bytes4 interfaceId, uint64 version) {
        return (type(IONFT).interfaceId, 1);
    }

    function setMsgInspector(address _msgInspector) public virtual onlyOwner {
        msgInspector = _msgInspector;
        emit MsgInspectorSet(_msgInspector);
    }

    function quoteSend(
        SendParam calldata _sendParam,
        bool _payInLzToken
    ) external view virtual returns (MessagingFee memory msgFee) {
        // @dev Builds the options and OFT message to quote in the endpoint.
        (bytes memory message, bytes memory options) = _buildMsgAndOptions(_sendParam);

        // @dev Calculates the LayerZero fee for the send() operation.
        return _quote(_sendParam.dstEid, message, options, _payInLzToken);
    }

    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable virtual returns (MessagingReceipt memory msgReceipt, ONFTReceipt memory onftReceipt) {
        // @dev Applies the token transfers regarding this send() operation.
        // - amountSentLD is the amount in local decimals that was ACTUALLY sent/debited from the sender.
        // - amountReceivedLD is the amount in local decimals that will be received/credited to the recipient on the remote OFT instance.
        uint256 tokenId = _debit(_sendParam.tokenId, _sendParam.dstEid);

        // @dev Builds the options and OFT message to quote in the endpoint.
        (bytes memory message, bytes memory options) = _buildMsgAndOptions(_sendParam);

        // @dev Sends the message to the LayerZero endpoint and returns the LayerZero msg receipt.
        msgReceipt = _lzSend(_sendParam.dstEid, message, options, _fee, _refundAddress);
        // @dev Formulate the OFT receipt.
        onftReceipt = ONFTReceipt(tokenId);

        emit ONFTSent(msgReceipt.guid, _sendParam.dstEid, msg.sender, tokenId);
    }

    function _buildMsgAndOptions(
        SendParam calldata _sendParam
    ) internal view virtual returns (bytes memory message, bytes memory options) {
        // @dev This generated message has the msg.sender encoded into the payload so the remote knows who the caller is.
        (message) = ONFTMsgCodec.encode(_sendParam.to, _sendParam.tokenId);
        uint16 msgType = SEND;
        // @dev Combine the callers _extraOptions with the enforced options via the OAppOptionsType3.
        options = combineOptions(_sendParam.dstEid, msgType, _sendParam.extraOptions);

        // @dev Optionally inspect the message and options depending if the OApp owner has set a msg inspector.
        // @dev If it fails inspection, needs to revert in the implementation. ie. does not rely on return boolean
        if (msgInspector != address(0)) IOAppMsgInspector(msgInspector).inspect(message, options);
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address /*_executor*/, // @dev unused in the default implementation.
        bytes calldata /*_extraData*/ // @dev unused in the default implementation.
    ) internal virtual override {
        // @dev The src sending chain doesnt know the address length on this chain (potentially non-evm)
        // Thus everything is bytes32() encoded in flight.
        address toAddress = _message.sendTo().bytes32ToAddress();
        // @dev Credit the amountLD to the recipient and return the ACTUAL amount the recipient received in local decimals
        uint256 tokenId = _credit(toAddress, _message.tokenId(), _origin.srcEid);

        emit ONFTReceived(_guid, _origin.srcEid, toAddress, tokenId);
    }

    function _lzReceiveSimulate(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal virtual override {
        _lzReceive(_origin, _guid, _message, _executor, _extraData);
    }

    function isPeer(uint32 _eid, bytes32 _peer) public view virtual override returns (bool) {
        return peers[_eid] == _peer;
    }

    function _debit(uint256 _tokenId, uint32 _dstEid) internal virtual returns (uint256 tokenId);

    function _credit(address _to, uint256 _tokenId, uint32 _srcEid) internal virtual returns (uint256 tokenId);
}
