import { ethers } from 'hardhat';
import { MOONRIVER_MIGRATOR_ADDRESS } from '../utils';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = MigratorFactory.attach(MOONRIVER_MIGRATOR_ADDRESS);
  const currentBatch = await migrator.currentBatch();
  const previousBatch = currentBatch.sub(1);
  console.log(`Will finish batch: ${previousBatch}`);

  let tx = await migrator.finishBatch(previousBatch);
  await tx.wait();
  console.log(`Finished migrating batch ${previousBatch}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
