import { ethers } from 'hardhat';
import { MOONBEAM_MIGRATOR_ADDRESS, getMultiSigAddress } from '../utils';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = MigratorFactory.attach(MOONBEAM_MIGRATOR_ADDRESS);

  const tx = await migrator.transferOwnership(getMultiSigAddress());
  await tx.wait();
  console.log('Ownership transferred to multisig');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
