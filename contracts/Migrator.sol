// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IRMRK.sol";

error ArrayLenghtsDoNotMatch();

contract Migrator is Ownable, Pausable {
    IRMRK public immutable legacyRmrk;
    IRMRK public immutable newRmrk;
    uint256 public constant MULTIPLIER = 10 ** 8; // To go from 10 decimals to 18 decimals

    constructor(address legacyRmrk_, address newRmrk_) {
        legacyRmrk = IRMRK(legacyRmrk_);
        newRmrk = IRMRK(newRmrk_);
    }

    function migrate(
        address[] memory tos,
        uint256[] memory amounts
    ) public onlyOwner whenNotPaused {
        uint256 length = tos.length;
        if (length != amounts.length) revert ArrayLenghtsDoNotMatch();
        for (uint256 i; i < length; ) {
            newRmrk.mint(tos[i], amounts[i] * MULTIPLIER);
            unchecked {
                ++i;
            }
        }
    }

    function swapLegacyRMRK(uint256 amount, address to) public whenNotPaused {
        legacyRmrk.transferFrom(msg.sender, address(this), amount);
        legacyRmrk.burn(amount);
        newRmrk.mint(to, amount * MULTIPLIER);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
