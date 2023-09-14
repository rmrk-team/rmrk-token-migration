// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ITokenManager} from "@axelar-network/interchain-token-service/contracts/interfaces/ITokenManager.sol";
import {AddressBytesUtils} from "@axelar-network/interchain-token-service/contracts/libraries/AddressBytesUtils.sol";

error MaxSupplyExceeded();

contract RMRK is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    using AddressBytesUtils for address;

    ITokenManager public tokenManager;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    address public creator;

    constructor() ERC20("RMRK", "RMRK") ERC20Permit("RMRK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        creator = msg.sender;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(from, amount);
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
     * @param destinationChain The destination chain identifier.
     * @param recipient The address of the recipient.
     * @param amount The amount of token to be transfered.
     */
    function interchainTransfer(
        string calldata destinationChain,
        address recipient,
        uint256 amount
    ) external payable {
        address sender = msg.sender;
        tokenManager.transmitInterchainTransfer{value: msg.value}(
            sender,
            destinationChain,
            recipient.toBytes(),
            amount,
            ""
        );
    }

    /**
     * @notice Implementation of the interchainTransferFrom method
     * @param sender the sender of the tokens. They need to have approved `msg.sender` before this is called.
     * @param destinationChain The destination chain identifier.
     * @param recipient the bytes representation of the address of the recipient.
     * @param amount the amount of token to be transfered.
     */
    function interchainTransferFrom(
        address sender,
        string calldata destinationChain,
        address recipient,
        uint256 amount
    ) external payable {
        uint256 _allowance = allowance(sender, msg.sender);

        if (_allowance != type(uint256).max) {
            _approve(sender, msg.sender, _allowance - amount);
        }

        tokenManager.transmitInterchainTransfer{value: msg.value}(
            sender,
            destinationChain,
            recipient.toBytes(),
            amount,
            ""
        );
    }
}
