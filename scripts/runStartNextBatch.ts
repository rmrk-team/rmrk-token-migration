import { ethers } from 'hardhat';
import { MoonriverMigrator } from '../typechain-types';

async function main() {
  const migratorAddress = '0xB75B0654F312d6905a075E6cDdE5501560781518';
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
