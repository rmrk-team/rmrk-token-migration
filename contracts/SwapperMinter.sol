// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {PausableWithDelay} from "./PausableWithDelay.sol";
import {IMintableBurnableERC20} from "./interfaces/IMintableBurnableERC20.sol";

// This contract is used to swap legacy RMRK tokens for new RMRK tokens. It can mint new RMRK tokens.
contract SwapperMinter is PausableWithDelay {
    IMintableBurnableERC20 public immutable LEGACY_RMRK;
    IMintableBurnableERC20 public immutable NEW_RMRK;
    uint256 public constant MULTIPLIER = 10 ** 8; // To go from 10 decimals to 18 decimals

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
     * @notice Swaps legacy RMRK tokens for the new RMRK tokens.
     * @param amount The amount of legacy RMRK tokens to swap.
     * @param to The address to send the new RMRK tokens to.
     * @dev The msg.sender needs to approve the contract to transfer the legacy RMRK tokens.
     */
    function swapLegacyRMRK(uint256 amount, address to) external whenNotPaused {
        // Legacy RMRK does not allow for burning, so we send to dead.
        LEGACY_RMRK.transferFrom(
            _msgSender(),
            0x000000000000000000000000000000000000dEaD,
            amount
        );
        NEW_RMRK.mint(to, amount * MULTIPLIER);
        emit Swapped(_msgSender(), to, amount);
    }
}
