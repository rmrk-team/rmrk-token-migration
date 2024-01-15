import { ethers } from 'hardhat';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = MigratorFactory.attach('0xB75B0654F312d6905a075E6cDdE5501560781518'); // TODO: Change this to the correct address
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
