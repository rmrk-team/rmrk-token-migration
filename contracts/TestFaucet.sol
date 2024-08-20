// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IMintableBurnableERC20} from "./interfaces/IMintableBurnableERC20.sol";

error UserHasEnoughTokens();

contract TestFaucet  {
    IMintableBurnableERC20 public immutable TOKEN;
    uint256 public immutable MAX_BALANCE_TO_CLAIM;
    uint256 public immutable MINT_AMOUNT;
    

    constructor(
        address token,
        uint256 maxBalanceToClaim,
        uint256 mintAmount
    )  {
        TOKEN = IMintableBurnableERC20(token);
        MAX_BALANCE_TO_CLAIM = maxBalanceToClaim;
        MINT_AMOUNT = mintAmount;
    }

    function request(
        address user
    ) external {
        uint256 currentBalance = TOKEN.balanceOf(user);
        if (currentBalance >= MAX_BALANCE_TO_CLAIM) revert UserHasEnoughTokens();
        TOKEN.mint(user, MINT_AMOUNT);
    }
}
