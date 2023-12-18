// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.21;

contract DeployProxy {
    // Emitted when a new contract is deployed.
    event NewContract(address addr);

    // Deploys a contract using create2.
    function deployContract(bytes memory bytecode, uint256 salt) public {
        address addr;
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }

        emit NewContract(addr);
    }
}
