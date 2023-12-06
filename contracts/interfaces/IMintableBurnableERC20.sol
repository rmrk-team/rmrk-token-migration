// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface for ERC with mint and burn functions.
interface IMintableBurnableERC20 is IERC20 {
    /**
     * @notice Mint new tokens.
     * @param to The address of the recipient.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burn tokens.
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) external;
}
