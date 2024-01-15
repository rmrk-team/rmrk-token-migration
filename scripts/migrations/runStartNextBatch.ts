import { ethers } from 'hardhat';
import { MoonriverMigrator } from '../../typechain-types';
import { MOONRIVER_MIGRATOR_ADDRESS } from '../utils';

async function main() {
  const migratorAddress = MOONRIVER_MIGRATOR_ADDRESS;
  const migratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = migratorFactory.attach(migratorAddress) as MoonriverMigrator;

  const currentBatch = await migrator.currentBatch();
  console.log(`Current batch: ${currentBatch}`);

  const tx = await migrator.startNextBatch();
  await tx.wait();
  console.log('Next batch started');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
