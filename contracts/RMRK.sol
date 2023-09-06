// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ITokenManager} from "@axelar-network/interchain-token-service/contracts/interfaces/ITokenManager.sol";

error MaxSupplyExceeded();

contract RMRK is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    ITokenManager public tokenManager;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public creator;

    constructor() ERC20("RMRK", "RMRK") ERC20Permit("RMRK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        creator = msg.sender;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function maxSupply() public pure returns (uint256) {
        return 10_000_000 * (10 ** 18); // 10M
    }

    function setTokenManager(
        address tokenManager_
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenManager = ITokenManager(tokenManager_);
    }

    function _beforeTokenTransfer(
        address from,
        address,
        uint256 amount
    ) internal override {
        if (from == address(0)) {
            // When minting tokens
            if (totalSupply() + amount > maxSupply())
                revert MaxSupplyExceeded();
        }
    }

    /**
     * @notice Implementation of the interchainTransfer method
     * @dev We chose to either pass `metadata` as raw data on a remote contract call, or, if no data is passed, just do a transfer.
     * A different implementation could have `metadata` that tells this function which function to use or that it is used for anything else as well.
     * @param destinationChain The destination chain identifier.
     * @param recipient The bytes representation of the address of the recipient.
     * @param amount The amount of token to be transfered.
     * @param metadata Either empty, to just facilitate an interchain transfer, or the data can be passed for an interchain contract call with transfer as per semantics defined by the token service.
     */
    function interchainTransfer(
        string calldata destinationChain,
        bytes calldata recipient,
        uint256 amount,
        bytes calldata metadata
    ) external payable {
        address sender = msg.sender;

        // Metadata semantics are defined by the token service and thus should be passed as-is.
        tokenManager.transmitInterchainTransfer{value: msg.value}(
            sender,
            destinationChain,
            recipient,
            amount,
            metadata
        );
    }

    /**
     * @notice Implementation of the interchainTransferFrom method
     * @dev We chose to either pass `metadata` as raw data on a remote contract call, or, if no data is passed, just do a transfer.
     * A different implementation could have `metadata` that tells this function which function to use or that it is used for anything else as well.
     * @param sender the sender of the tokens. They need to have approved `msg.sender` before this is called.
     * @param destinationChain the string representation of the destination chain.
     * @param recipient the bytes representation of the address of the recipient.
     * @param amount the amount of token to be transfered.
     * @param metadata either empty, to just facilitate a cross-chain transfer, or the data to be passed to a cross-chain contract call and transfer.
     */
    function interchainTransferFrom(
        address sender,
        string calldata destinationChain,
        bytes calldata recipient,
        uint256 amount,
        bytes calldata metadata
    ) external payable {
        uint256 _allowance = allowance(sender, msg.sender);

        if (_allowance != type(uint256).max) {
            _approve(sender, msg.sender, _allowance - amount);
        }

        tokenManager.transmitInterchainTransfer{value: msg.value}(
            sender,
            destinationChain,
            recipient,
            amount,
            metadata
        );
    }
}
