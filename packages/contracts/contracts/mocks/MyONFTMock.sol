// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { MyONFT } from "../MyONFT.sol";

// @dev WARNING: This is for testing purposes only
contract MyONFTMock is MyONFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) MyONFT(_name, _symbol, _lzEndpoint, _delegate) {}

    function mint(address _to, uint256 _tokenId) public {
        _mint(_to, _tokenId);
    }
}
