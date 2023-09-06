// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ITokenManagerType} from "@axelar-network/interchain-token-service/contracts/interfaces/ITokenManagerType.sol";

contract MockITS {
    function deployCustomTokenManager(
        bytes32 salt,
        ITokenManagerType.TokenManagerType tokenManagerType,
        bytes memory params
    ) external payable returns (bytes32 tokenId) {
        return bytes32(0);
    }

    function deployRemoteCustomTokenManager(
        bytes32 salt,
        string calldata destinationChain,
        ITokenManagerType.TokenManagerType tokenManagerType,
        bytes calldata params,
        uint256 gasValue
    ) external payable returns (bytes32 tokenId) {
        return bytes32(0);
    }

    function getParamsMintBurn(
        bytes memory operator,
        address tokenAddress
    ) external pure returns (bytes memory params) {
        return "";
    }

    function getTokenManagerAddress(
        bytes32 tokenId
    ) external view returns (address tokenManagerAddress) {
        return address(0);
    }

    function getCustomTokenId(
        address sender,
        bytes32 salt
    ) external pure returns (bytes32 tokenId) {
        return bytes32(0);
    }

    function registerCanonicalToken(
        address tokenAddress
    ) external payable returns (bytes32 tokenId) {
        return bytes32(0);
    }

    function getCanonicalTokenId(
        address tokenAddress
    ) public view returns (bytes32 tokenId) {
        return bytes32(0);
    }
}
