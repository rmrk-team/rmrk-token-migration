// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

// Mock used for simulating legacy RMRK tokens.
contract LegacyRMRK is ERC20, ERC20Burnable {
    constructor() ERC20("xcRMRK", "xcRMRK") {}

    /**
     * @notice Mints new tokens.
     * @param to The address of the recipient.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Number of decimals for this token.
     * @return decimals_ The number of decimals.
     */
    function decimals() public pure override returns (uint8 decimals_) {
        decimals_ = 10;
    }
}
