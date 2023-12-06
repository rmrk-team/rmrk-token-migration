// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ITokenManagerType} from "@axelar-network/interchain-token-service/contracts/interfaces/ITokenManagerType.sol";
import {InterchainTokenService} from "@axelar-network/interchain-token-service/contracts/InterchainTokenService.sol";

contract MockITS {
    /**
     * @notice Deploys a custom token manager contract on a remote chain.
     * @param salt The salt used for token manager deployment.
     * @param destinationChain The name of the destination chain.
     * @param tokenManagerType The type of token manager.
     * @param params_ The deployment parameters.
     * @param gasValue The gas value for deployment.
     */
    function deployTokenManager(
        bytes32 salt,
        string calldata destinationChain,
        ITokenManagerType.TokenManagerType tokenManagerType,
        bytes calldata params_,
        uint256 gasValue
    ) external payable returns (bytes32 tokenId) {
        return bytes32(0);
    }

    /**
     * @notice Returns the address of the token manager associated with the given tokenId.
     * @param tokenId The tokenId of the token manager.
     * @return tokenManagerAddress_ The address of the token manager.
     */
    function tokenManagerAddress(
        bytes32 tokenId
    ) external view returns (address tokenManagerAddress_) {
        return address(0);
    }

    /**
     * @notice Returns the custom tokenId associated with the given operator and salt.
     * @param operator_ The operator address.
     * @param salt The salt used for token id calculation.
     * @return tokenId The custom tokenId associated with the operator and salt.
     */
    function interchainTokenId(
        address operator_,
        bytes32 salt
    ) external view returns (bytes32 tokenId) {
        return bytes32(0);
    }

    function tokenManagerImplementation(
        uint256 tokenManagerType
    ) external view returns (address tokenManager) {
        return address(0);
    }

    function params(
        bytes memory operator_,
        address tokenAddress_
    ) external pure returns (bytes memory params_) {
        params_ = abi.encode(operator_, tokenAddress_);
    }
}
