// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { MyNativeOFT } from "../MyNativeOFT.sol";

// @dev WARNING: This is for testing purposes only
contract MyNativeOFTMock is MyNativeOFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) MyNativeOFT(_name, _symbol, _lzEndpoint, _delegate) {}
}
