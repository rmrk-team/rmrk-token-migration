import { ethers } from 'hardhat';
import { MOONRIVER_MIGRATOR_ADDRESS } from '../utils';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = MigratorFactory.attach(MOONRIVER_MIGRATOR_ADDRESS);
  const currentBatch = await migrator.currentBatch();
  console.log(`Current batch: ${currentBatch}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
