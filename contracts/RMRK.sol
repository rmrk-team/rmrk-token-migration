// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

error MaxSupplyExceeded();

contract RMRK is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("RMRK", "RMRK") ERC20Permit("RMRK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function maxSupply() public pure returns (uint256) {
        return 10_000_000 * (10 ** 18); // 10M
    }

    function _beforeTokenTransfer(
        address from,
        address,
        uint256 amount
    ) internal override {
        if (from == address(0)) {
            // When minting tokens
            if (totalSupply() + amount > maxSupply())
                revert MaxSupplyExceeded();
        }
    }
}
