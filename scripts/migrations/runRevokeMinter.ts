import { ethers } from 'hardhat';
import { NEW_RMRK_ADDRESS } from '../utils';

async function main() {
  const rmrkFactory = await ethers.getContractFactory('RMRK');
  const rmrk = rmrkFactory.attach(NEW_RMRK_ADDRESS);
  const role = await rmrk.MINTER_ROLE();
  const revokeFor = '0x43A87C2e6617cAae6a483AC369DbaFc7c8a2433E'; // Initial Moonbeam migrator address
  let tx = await rmrk.revokeRole(role, revokeFor);
  await tx.wait();
  console.log(`Minter role revoked from: ${revokeFor}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
