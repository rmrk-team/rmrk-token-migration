import { ethers } from 'hardhat';
import { getMultiSigAddress, NEW_RMRK_ADDRESS } from '../utils';

async function main() {
  const rmrkFactory = await ethers.getContractFactory('RMRK');
  const rmrk = rmrkFactory.attach(NEW_RMRK_ADDRESS);
  const role = await rmrk.DEFAULT_ADMIN_ROLE();

  const tx = await rmrk.grantRole(role, getMultiSigAddress());
  await tx.wait();
  console.log('Granted admin to multisig, use multisig to revoke admin to rmrk-minter account.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
