import { ethers } from 'hardhat';
import { MOONBEAM_MIGRATOR_ADDRESS } from '../utils';

async function main() {
  const currentBatch = 4; // TODO: make this a parameter

  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = MigratorFactory.attach(MOONBEAM_MIGRATOR_ADDRESS);
  const dataPath = `./migrations/${currentBatch}.json`;

  const fs = require('fs');
  let { holders, amounts } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  amounts = amounts.map((amount: string) => ethers.BigNumber.from(amount));

  console.log(`Holders: ${holders}`);
  console.log(`Amounts: ${amounts}`);
  let tx = await migrator.migrate(currentBatch, holders, amounts);
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
