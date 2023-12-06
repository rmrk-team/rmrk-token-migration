// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {PausableWithDelay} from "./PausableWithDelay.sol";
import {IMintableBurnableERC20} from "./interfaces/IMintableBurnableERC20.sol";

// Sent arrays are expected to have the same length but they don't.
error ArrayLenghtsDoNotMatch();

// This contract is used to migrate the legacy RMRK tokens to the new RMRK tokens. It can also be used to swap legacy RMRK tokens for new RMRK tokens.
contract Migrator is PausableWithDelay {
    // The legacy RMRK token
    IMintableBurnableERC20 public immutable LEGACY_RMRK;
    // The new RMRK token
    IMintableBurnableERC20 public immutable NEW_RMRK;
    // To go from 10 decimals to 18 decimals
    uint256 public constant MULTIPLIER = 10 ** 8; // To go from 10 decimals to 18 decimals

    // Emitted when legacy RMRK tokens are migrated to new RMRK tokens. Amount is in New RMRK tokens.
    event Migrated(address indexed to, uint256 amount);
    // Emitted when legacy RMRK tokens are swapped for new RMRK tokens. Amount is in New RMRK tokens.
    event Swapped(address indexed sender, address indexed to, uint256 amount);

    constructor(
        address legacyRmrk_,
        address newRmrk_,
        uint256 delay
    ) PausableWithDelay(delay) {
        LEGACY_RMRK = IMintableBurnableERC20(legacyRmrk_);
        NEW_RMRK = IMintableBurnableERC20(newRmrk_);
    }

    /**
     * @dev Migrates the legacy RMRK tokens to the new RMRK tokens.
     * @param tos The addresses to send the new RMRK tokens to.
     * @param amounts The amounts of legacy RMRK tokens to migrate.
     */
    function migrate(
        address[] memory tos,
        uint256[] memory amounts
    ) external onlyOwner whenNotPaused {
        uint256 length = tos.length;
        if (length != amounts.length) revert ArrayLenghtsDoNotMatch();
        for (uint256 i; i < length; ) {
            address to = tos[i];
            uint256 amount = amounts[i] * MULTIPLIER;
            NEW_RMRK.mint(to, amount);
            emit Migrated(to, amount);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Migrates the legacy RMRK tokens to the new RMRK tokens.
     * @param amount The amount of legacy RMRK tokens to migrate.
     * @param to The address to send the new RMRK tokens to.
     * @dev The msg.sender needs to approve the contract to transfer the legacy RMRK tokens.
     */
    function swapLegacyRMRK(uint256 amount, address to) external whenNotPaused {
        LEGACY_RMRK.transferFrom(_msgSender(), address(this), amount);
        LEGACY_RMRK.burn(amount);
        NEW_RMRK.mint(to, amount * MULTIPLIER);
        emit Swapped(_msgSender(), to, amount);
    }
}
