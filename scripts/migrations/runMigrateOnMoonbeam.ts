import { ethers } from 'hardhat';

async function main() {
  const currentBatch = 4; // TODO: make this a parameter

  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = MigratorFactory.attach('0x2C79B64d30aB121f24B98cc44E2393A7cBb201f6'); // TODO: Change this to the correct address
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
