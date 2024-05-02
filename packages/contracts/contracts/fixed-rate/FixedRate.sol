// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { IFixedRate, SendParam } from "./interfaces/IFixedRate.sol";
import { OAppOptionsType3 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { FixedRateMsgCodec } from "./libs/FixedRateMsgCodec.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

error InsufficientBalance();
error RateConfiguredNotFound();

contract FixedRate is IFixedRate, OApp, OAppOptionsType3 {
    using FixedRateMsgCodec for bytes;
    using FixedRateMsgCodec for bytes32;

    uint16 public constant SEND = 1;

    // Rate
    mapping(uint32 => uint256) public numerators;
    mapping(uint32 => uint256) public denominators;

    constructor(address _endpoint, address _delegate) OApp(_endpoint, _delegate) Ownable(_delegate) {}

    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable virtual {
        if (msg.value < _sendParam.amount + _fee.nativeFee) {
            revert InsufficientBalance();
        }

        (bytes memory message, bytes memory options) = _buildMsgAndOptions(_sendParam);

        // @dev Sends the message to the LayerZero endpoint and returns the LayerZero msg receipt.
        _lzSend(_sendParam.dstEid, message, options, _fee, _refundAddress);
    }

    function quote(
        SendParam calldata _sendParam,
        bool _payInLzToken // boolean for which token to return fee in
    ) external view virtual returns (MessagingFee memory msgFee) {
        (bytes memory message, bytes memory options) = _buildMsgAndOptions(_sendParam);

        return _quote(_sendParam.dstEid, message, options, _payInLzToken);
    }

    function _buildMsgAndOptions(
        SendParam calldata _sendParam
    ) internal view virtual returns (bytes memory message, bytes memory options) {
        (message) = FixedRateMsgCodec.encode(_sendParam.to, _sendParam.amount);
        options = combineOptions(_sendParam.dstEid, SEND, _sendParam.extraOptions);
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32,
        bytes calldata _message,
        address,
        bytes calldata
    ) internal virtual override {
        address toAddress = _message.sendTo().bytes32ToAddress();
        uint256 amount = _message.amount();
        if (numerators[_origin.srcEid] == 0 || denominators[_origin.srcEid] == 0) {
            revert RateConfiguredNotFound();
        }
        uint256 convertedAmount = (amount * numerators[_origin.srcEid]) / denominators[_origin.srcEid];
        Address.sendValue(payable(toAddress), convertedAmount);
    }

    function deposit() public payable onlyOwner {}

    receive() external payable {
        deposit();
    }

    function withdraw(uint256 amount) public onlyOwner {
        if (totalSupply() < amount) {
            revert InsufficientBalance();
        }
        Address.sendValue(payable(_msgSender()), amount);
    }

    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    function setRate(uint32 eid, uint256 numerator, uint256 denominator) public onlyOwner {
        numerators[eid] = numerator;
        denominators[eid] = denominator;
    }

    function rateOf(uint32 eid) public view returns (uint256 numerator, uint256 denominator) {
        numerator = numerators[eid];
        denominator = denominators[eid];
    }

    function _payNative(uint256 _nativeFee) internal virtual override returns (uint256 nativeFee) {
        if (msg.value < _nativeFee) revert NotEnoughNative(msg.value);
        return _nativeFee;
    }
}
