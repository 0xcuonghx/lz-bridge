// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ONFTAdapter } from "./onft/ONFTAdapter.sol";

contract MyONFTAdapter is ONFTAdapter {
    constructor(
        address _token,
        address _lzEndpoint,
        address _delegate
    ) ONFTAdapter(_token, _lzEndpoint, _delegate) Ownable(_delegate) {}
}
