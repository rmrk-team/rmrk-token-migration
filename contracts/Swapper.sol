// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IRMRK.sol";

error NotEnoughBalance();

contract Swapper is Ownable, Pausable {
    IRMRK public immutable legacyRmrk;
    IRMRK public immutable newRmrk;
    uint256 public constant MULTIPLIER = 10 ** 8; // To go from 10 decimals to 18 decimals

    constructor(address legacyRmrk_, address newRmrk_) Ownable(msg.sender) {
        legacyRmrk = IRMRK(legacyRmrk_);
        newRmrk = IRMRK(newRmrk_);
    }

    function swapLegacyRMRK(uint256 amount, address to) public whenNotPaused {
        legacyRmrk.transferFrom(msg.sender, address(this), amount);
        uint256 newRMRKAmount = amount * MULTIPLIER;
        if (newRmrk.balanceOf(address(this)) < newRMRKAmount)
            revert NotEnoughBalance();
        newRmrk.transfer(to, newRMRKAmount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function burnLegacyRMRK(uint256 amount) public onlyOwner {
        legacyRmrk.burn(amount);
    }
}
