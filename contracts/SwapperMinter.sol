// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./PausableWithDelay.sol";
import "./interfaces/IRMRK.sol";

contract SwapperMinter is PausableWithDelay {
    IRMRK public immutable legacyRmrk;
    IRMRK public immutable newRmrk;
    uint256 public constant MULTIPLIER = 10 ** 8; // To go from 10 decimals to 18 decimals

    constructor(
        address legacyRmrk_,
        address newRmrk_,
        uint256 delay
    ) PausableWithDelay(delay) {
        legacyRmrk = IRMRK(legacyRmrk_);
        newRmrk = IRMRK(newRmrk_);
    }

    function swapLegacyRMRK(uint256 amount, address to) external whenNotPaused {
        legacyRmrk.transferFrom(msg.sender, address(this), amount);
        uint256 newRMRKAmount = amount * MULTIPLIER;
        newRmrk.mint(to, newRMRKAmount);
        legacyRmrk.burn(amount);
    }
}
