// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MyNativeOFT is OFT, ReentrancyGuard {
    event Deposit(address indexed _dst, uint _amount);
    event Withdrawal(address indexed _src, uint _amount);

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {}

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint _amount) external nonReentrant {
        require(balanceOf(msg.sender) >= _amount, "NativeOFT: Insufficient balance.");
        _burn(msg.sender, _amount);
        (bool success, ) = msg.sender.call{ value: _amount }("");
        require(success, "NativeOFTV2: failed to unwrap");
        emit Withdrawal(msg.sender, _amount);
    }

    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override(OFT) returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        (amountSentLD, amountReceivedLD) = _debitView(_amountLD, _minAmountLD, _dstEid);
        // if (balanceOf(msg.sender) < amountSentLD) {
        //     require(balanceOf(msg.sender) + msg.value >= amountSentLD, "NativeOFT: Insufficient msg.value");
        //     // user can cover difference with additional msg.value ie. wrapping
        //     _mint(address(msg.sender), amountSentLD - balanceOf(msg.sender));
        // }
        _transfer(msg.sender, address(this), amountSentLD);
    }

    function _credit(address _to, uint256 _amountLD, uint32 /*_srcEid*/) internal override(OFT) returns (uint) {
        _burn(address(this), _amountLD);
        (bool success, ) = _to.call{ value: _amountLD }("");
        require(success, "NativeOFT: failed to _credit");
        return _amountLD;
    }
}
