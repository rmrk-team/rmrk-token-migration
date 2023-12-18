// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

import {InterchainTokenStandard} from "@axelar-network/interchain-token-service/contracts/interchain-token/InterchainTokenStandard.sol";

error MaxSupplyExceeded();

// RMRK is the ERC20 token used by the RMRK protocol.
contract RMRK is
    InterchainTokenStandard,
    ERC20,
    ERC20Burnable,
    ERC20Permit,
    AccessControl
{
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    // Interchain token service address
    address private _interchainTokenService;
    // Token ID, from ITS
    bytes32 private _tokenId;

    constructor() ERC20("RMRK", "RMRK") ERC20Permit("RMRK") {
        _grantRole(
            DEFAULT_ADMIN_ROLE,
            0xCD7A0D098E3A750126b0fec54BE401476812cfc0
        );
    }

    /**
     * @notice Mint new tokens.
     * @dev Can only be called by a minter.
     * @param to The address of the recipient.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens.
     * @dev Can only be called by a burner.
     * @param from The address of the owner.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    /**
     * @notice Getter for the max supply of this token.
     * @return maxSupply_ The maximum supply of this token.
     */
    function maxSupply() public pure returns (uint256 maxSupply_) {
        maxSupply_ = 10_000_000 * (10 ** 18); // 10M
    }

    /**
     * @inheritdoc InterchainTokenStandard
     */
    function interchainTokenId()
        public
        view
        override
        returns (bytes32 tokenId_)
    {
        tokenId_ = _tokenId;
    }

    /**
     * @inheritdoc InterchainTokenStandard
     */
    function interchainTokenService()
        public
        view
        override
        returns (address service)
    {
        service = _interchainTokenService;
    }

    /**
     * @notice Setter for the interchain token service and tokenId.
     * @param tokenId_ The tokenId that this token is registerred under.
     * @param its_ The address of the interchain token service.
     */
    function setTokenIdAndIts(
        bytes32 tokenId_,
        address its_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _tokenId = tokenId_;
        _interchainTokenService = its_;
    }

    /**
     * @inheritdoc ERC20
     * @dev We override this function to add a check for the max supply.
     */
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
     * @inheritdoc ERC20
     */
    function _spendAllowance(
        address sender,
        address spender,
        uint256 amount
    ) internal override(ERC20, InterchainTokenStandard) {
        ERC20._spendAllowance(sender, spender, amount);
    }
}
