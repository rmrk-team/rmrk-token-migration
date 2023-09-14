// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PausableWithDelay is Pausable, Ownable {
    uint256 public delay;
    uint256 public unpausableAt;
    mapping(address => bool) canPause;

    error CannotUnpauseYet(uint256 unpausableAt);
    error Unauthorized();

    modifier onlyOwnerOrPauser() {
        _checkOwnerOrPauser();
        _;
    }

    constructor(uint256 delay_) {
        _setDelay(delay);
    }

    function _pauseWithDelay() internal virtual {
        unpausableAt = block.timestamp + delay;
        _pause();
    }

    function _unpause() internal virtual override {
        if (unpausableAt != 0 && unpausableAt > block.timestamp)
            revert CannotUnpauseYet(unpausableAt);
        super._unpause();
    }

    function _setDelay(uint256 newDelay) internal virtual {
        delay = newDelay;
    }

    function _setCanPause(address account, bool canPause_) internal virtual {
        canPause[account] = canPause_;
    }

    function pause() external onlyOwnerOrPauser {
        _pause();
    }

    function pauseWithDelay() external onlyOwnerOrPauser {
        _pauseWithDelay();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setDelay(uint256 newDelay) external onlyOwner {
        _setDelay(newDelay);
    }

    function setCanPause(address account, bool canPause_) external onlyOwner {
        _setCanPause(account, canPause_);
    }

    function _checkOwnerOrPauser() internal view {
        if (msg.sender != owner() && !canPause[msg.sender])
            revert Unauthorized();
    }
}
