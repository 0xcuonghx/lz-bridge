// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ONFTCore } from "./ONFTCore.sol";

abstract contract ONFT is ONFTCore, ERC721 {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) ERC721(_name, _symbol) ONFTCore(_lzEndpoint, _delegate) {}

    function token() external view returns (address) {
        return address(this);
    }

    function approvalRequired() external pure virtual returns (bool) {
        return false;
    }

    function _debit(uint256 _tokenId, uint32) internal virtual override returns (uint256 tokenId) {
        _burn(_tokenId);
        return _tokenId;
    }

    function _credit(address _to, uint256 _tokenId, uint32) internal virtual override returns (uint256 tokenId) {
        _safeMint(_to, _tokenId);
        return _tokenId;
    }
}
