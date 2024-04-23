// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { ONFTCore } from "./ONFTCore.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

error InvalidERC721Token();

abstract contract ONFTAdapter is ONFTCore {
    using ERC165Checker for address;

    IERC721 internal immutable innerToken;

    constructor(address _token, address _lzEndpoint, address _delegate) ONFTCore(_lzEndpoint, _delegate) {
        if (!_token.supportsInterface(type(IERC721).interfaceId)) {
            revert InvalidERC721Token();
        }
        innerToken = IERC721(_token);
    }

    function token() external view returns (address) {
        return address(innerToken);
    }

    function approvalRequired() external pure virtual returns (bool) {
        return true;
    }

    function _debit(uint256 _tokenId, uint32) internal virtual override returns (uint256 tokenId) {
        innerToken.safeTransferFrom(_msgSender(), address(this), _tokenId);
        return _tokenId;
    }

    function _credit(address _to, uint256 _tokenId, uint32) internal virtual override returns (uint256 tokenId) {
        innerToken.safeTransferFrom(address(this), _to, _tokenId);
        return _tokenId;
    }

    function onERC721Received(address _operator, address, uint, bytes memory) public virtual returns (bytes4) {
        // only allow `this` to transfer token from others
        if (_operator != address(this)) return bytes4(0);
        return IERC721Receiver.onERC721Received.selector;
    }
}
