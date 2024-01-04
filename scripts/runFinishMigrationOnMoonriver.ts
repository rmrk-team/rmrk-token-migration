import { ethers } from 'hardhat';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = MigratorFactory.attach('0xB75B0654F312d6905a075E6cDdE5501560781518');
  const currentBatch = await migrator.currentBatch();
  console.log(`Current batch: ${currentBatch}`);

  let tx = await migrator.finishBatch(currentBatch);
  await tx.wait();
  console.log(`Finished migrating batch ${currentBatch}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
