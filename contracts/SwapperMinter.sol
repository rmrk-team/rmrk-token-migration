// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IRMRK.sol";

error NotEnoughBalance();

contract SwapperMinter is Ownable, Pausable {
    IRMRK public immutable legacyRmrk;
    IRMRK public immutable newRmrk;
    uint256 public constant MULTIPLIER = 10 ** 8; // To go from 10 decimals to 18 decimals

    constructor(address legacyRmrk_, address newRmrk_) {
        legacyRmrk = IRMRK(legacyRmrk_);
        newRmrk = IRMRK(newRmrk_);
    }

    function swapLegacyRMRK(uint256 amount, address to) public whenNotPaused {
        legacyRmrk.transferFrom(msg.sender, address(this), amount);
        uint256 newRMRKAmount = amount * MULTIPLIER;
        newRmrk.mint(to, newRMRKAmount);
        legacyRmrk.burn(amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
