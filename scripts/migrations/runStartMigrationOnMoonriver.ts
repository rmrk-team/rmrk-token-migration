import { ethers } from 'hardhat';
import { MOONRIVER_MIGRATOR_ADDRESS } from '../utils';

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

  const [holders, amounts] = await migrator.getMigrationsForBatch(currentBatch);
  const data = {
    holders: holders,
    amounts: amounts.map((bn) => bn.toString()),
    batch: currentBatch.toString(),
  };

  // Store data in a file:
  const fs = require('fs');
  const dataPath = `./migrations/${currentBatch}.json`;
  fs.writeFileSync(dataPath, JSON.stringify(data));

  console.log(`Holders: ${holders}`);
  console.log(`Amounts: ${amounts}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
