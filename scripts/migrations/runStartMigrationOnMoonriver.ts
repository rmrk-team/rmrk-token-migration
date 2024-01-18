import { ethers } from 'hardhat';
import { MOONRIVER_MIGRATOR_ADDRESS } from '../utils';
import storeMigrationsForBatch from './storeMigrationsForBatch';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = MigratorFactory.attach(MOONRIVER_MIGRATOR_ADDRESS);
  const currentBatch = await migrator.currentBatch();
  console.log(`Current batch: ${currentBatch}`);

  let tx = await migrator.startMigratingBatch(currentBatch);
  await tx.wait();
  console.log(`Migrating batch ${currentBatch}`);

  tx = await migrator.startNextBatch();
  await tx.wait();
  console.log(`Started a new batch`);

  await storeMigrationsForBatch(migrator, currentBatch.toNumber());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
