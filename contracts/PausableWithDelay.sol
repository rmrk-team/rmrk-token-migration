// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Allows the contract to be paused and only unpaused after a delay has passed. The owner can add other accounts that can pause the contract, yet only the owner can unpause the contract.
contract PausableWithDelay is Pausable, Ownable {
    // The delay after which the contract can be unpaused, added to the block.timestamp when the contract is paused.
    uint256 public delay;
    // The timestamp after which the contract can be unpaused.
    uint256 public unpausableAt;
    // The accounts that can pause the contract.
    mapping(address => bool) public canPause;

    // The contract is cannot be unpaused yet.
    error CannotUnpauseYet(uint256 unpausableAt);
    // The caller is not the owner or a pauser.
    error UnauthorizedPause();

    // Checks that the caller is the owner or a authorized pauser.
    modifier onlyOwnerOrPauser() {
        _checkOwnerOrPauser();
        _;
    }

    constructor(uint256 delay_) Ownable(_msgSender()) {
        _setDelay(delay_);
    }

    /**
     * @notice Sets the delay after which the contract can be unpaused.
     * @param newDelay The new delay.
     */
    function _setDelay(uint256 newDelay) internal virtual {
        delay = newDelay;
    }

    /**
     * @notice Sets whether an account can pause the contract.
     * @param account The account to set.
     * @param canPause_ Whether the account can pause the contract.
     */
    function setCanPause(address account, bool canPause_) internal virtual {
        canPause[account] = canPause_;
    }

    /**
     * @notice Pauses the contract.
     */
    function pause() external onlyOwnerOrPauser {
        _pause();
    }

    /**
     * @notice Pauses the contract with a delay to unpause.
     */
    function pauseWithDelay() external onlyOwnerOrPauser {
        unpausableAt = block.timestamp + delay;
        _pause();
    }

    /**
     * @notice Unpauses the contract.
     * @dev The contract cannot be unpaused before the delay has passed.
     */
    function unpause() external onlyOwner {
        if (unpausableAt != 0 && unpausableAt > block.timestamp)
            revert CannotUnpauseYet(unpausableAt);
        _unpause();
    }

    /**
     * @notice Sets the delay after which the contract can be unpaused.
     * @param newDelay The new delay.
     */
    function setDelay(uint256 newDelay) external onlyOwner {
        _setDelay(newDelay);
    }

    /**
     * @notice Checks that the caller is the owner or a authorized pauser, reverts otherwise.
     */
    function _checkOwnerOrPauser() internal view {
        if (_msgSender() != owner() && !canPause[_msgSender()])
            revert UnauthorizedPause();
    }
}
