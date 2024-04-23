// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { MyONFTAdapter } from "../MyONFTAdapter.sol";

// @dev WARNING: This is for testing purposes only
contract MyONFTAdapterMock is MyONFTAdapter {
    constructor(address _token, address _lzEndpoint, address _delegate) MyONFTAdapter(_token, _lzEndpoint, _delegate) {}
}
