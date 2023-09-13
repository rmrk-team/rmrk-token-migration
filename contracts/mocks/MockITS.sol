// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ITokenManagerType} from "@axelar-network/interchain-token-service/contracts/interfaces/ITokenManagerType.sol";
import {TokenManagerMintBurn} from "@axelar-network/interchain-token-service/contracts/token-manager/implementations/TokenManagerMintBurn.sol";

contract MockITS {
    function deployCustomTokenManager(
        bytes32 salt,
        ITokenManagerType.TokenManagerType tokenManagerType,
        bytes memory params
    ) external payable returns (bytes32 tokenId) {
        return bytes32(0);
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
}
