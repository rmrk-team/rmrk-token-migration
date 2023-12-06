// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

import {AddressBytes} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressBytes.sol";
import {IInterchainTokenService} from "@axelar-network/interchain-token-service/contracts/interfaces/IInterchainTokenService.sol";

error MaxSupplyExceeded();

contract RMRK is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    using AddressBytes for address;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    address public creator;
    address private _its;
    bytes32 private _tokenId;

    constructor(address creator_) ERC20("RMRK", "RMRK") ERC20Permit("RMRK") {
        _grantRole(DEFAULT_ADMIN_ROLE, creator_);
        creator = creator_;
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

    /**
     * @notice Getter for the tokenId used for this token.
     * @dev Needs to be overwritten.
     * @return tokenId_ The tokenId that this token is registerred under.
     */
    function interchainTokenId()
        public
        view
        virtual
        returns (bytes32 tokenId_)
    {
        tokenId_ = _tokenId;
    }

    /**
     * @notice Getter for the interchain token service.
     * @dev Needs to be overwritten.
     * @return service The address of the interchain token service.
     */
    function interchainTokenService()
        public
        view
        virtual
        returns (address service)
    {
        service = _its;
    }

    function setTokenIdAndIts(
        bytes32 tokenId_,
        address its_
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _tokenId = tokenId_;
        _its = its_;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from == address(0)) {
            // When minting tokens
            if (totalSupply() + value > maxSupply()) revert MaxSupplyExceeded();
        }
        super._update(from, to, value);
    }

    /**
     * @notice Implementation of the interchainTransfer method
     * @dev We chose to either pass `metadata` as raw data on a remote contract call, or, if no data is passed, just do a transfer.
     * A different implementation could have `metadata` that tells this function which function to use or that it is used for anything else as well.
     * @param destinationChain The destination chain identifier.
     * @param recipient The bytes representation of the address of the recipient.
     * @param amount The amount of token to be transferred.
     * @param metadata Either empty, to just facilitate an interchain transfer, or the data can be passed for an interchain contract call with transfer as per semantics defined by the token service.
     */
    function interchainTransfer(
        string calldata destinationChain,
        bytes calldata recipient,
        uint256 amount,
        bytes calldata metadata
    ) external payable {
        IInterchainTokenService(_its).transmitInterchainTransfer{
            value: msg.value
        }(_tokenId, msg.sender, destinationChain, recipient, amount, metadata);
    }

    /**
     * @notice Implementation of the interchainTransferFrom method
     * @dev We chose to either pass `metadata` as raw data on a remote contract call, or, if no data is passed, just do a transfer.
     * A different implementation could have `metadata` that tells this function which function to use or that it is used for anything else as well.
     * @param sender the sender of the tokens. They need to have approved `msg.sender` before this is called.
     * @param destinationChain the string representation of the destination chain.
     * @param recipient the bytes representation of the address of the recipient.
     * @param amount the amount of token to be transferred.
     * @param metadata either empty, to just facilitate a cross-chain transfer, or the data to be passed to a cross-chain contract call and transfer.
     */
    function interchainTransferFrom(
        address sender,
        string calldata destinationChain,
        bytes calldata recipient,
        uint256 amount,
        bytes calldata metadata
    ) external payable {
        _spendAllowance(sender, msg.sender, amount);

        IInterchainTokenService(_its).transmitInterchainTransfer{
            value: msg.value
        }(_tokenId, sender, destinationChain, recipient, amount, metadata);
    }
}
