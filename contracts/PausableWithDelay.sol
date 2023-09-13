// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/security/Pausable.sol";

contract PausableWithDelay is Pausable {
    
    uint256 public delay;
    uint256 public unpausableAt;

    error CannotUnpauseYet(uint256 unpausableAt);

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
}
