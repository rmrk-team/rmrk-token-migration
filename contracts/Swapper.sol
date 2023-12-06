// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IMintableBurnableERC20} from "./interfaces/IMintableBurnableERC20.sol";

// This contract does not have enough New RMRK tokens to send back in the swap.
error NotEnoughBalance();

// This contract is used to swap legacy RMRK tokens for new RMRK tokens. It needs to be be loaded with new RMRK tokens.
contract Swapper is Ownable, Pausable {
    IMintableBurnableERC20 public immutable LEGACY_RMRK;
    IMintableBurnableERC20 public immutable NEW_RMRK;
    uint256 public constant MULTIPLIER = 10 ** 8; // To go from 10 decimals to 18 decimals

    // Emitted when legacy RMRK tokens are swapped for new RMRK tokens. Amount is in New RMRK tokens.
    event Swapped(address indexed sender, address indexed to, uint256 amount);
    // Emitted when legacy RMRK tokens are burned.
    event BurnedLegacyRMRK(uint256 amount);

    constructor(address legacyRmrk_, address newRmrk_) Ownable(_msgSender()) {
        LEGACY_RMRK = IMintableBurnableERC20(legacyRmrk_);
        NEW_RMRK = IMintableBurnableERC20(newRmrk_);
    }

    /**
     * @notice Swaps the legacy RMRK tokens for the new RMRK tokens.
     * @param amount The amount of legacy RMRK tokens to swap.
     * @param to The address to send the new RMRK tokens to.
     */
    function swapLegacyRMRK(uint256 amount, address to) external whenNotPaused {
        uint256 newRMRKAmount = amount * MULTIPLIER;
        if (NEW_RMRK.balanceOf(address(this)) < newRMRKAmount)
            revert NotEnoughBalance();
        LEGACY_RMRK.transferFrom(_msgSender(), address(this), amount);
        NEW_RMRK.transfer(to, newRMRKAmount);
        emit Swapped(_msgSender(), to, amount);
    }

    /**
     * @notice Pauses the contract.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Burns the legacy RMRK tokens.
     * @param amount The amount of legacy RMRK tokens to burn.
     */
    function burnLegacyRMRK(uint256 amount) external onlyOwner {
        LEGACY_RMRK.burn(amount);
        emit BurnedLegacyRMRK(amount);
    }
}
