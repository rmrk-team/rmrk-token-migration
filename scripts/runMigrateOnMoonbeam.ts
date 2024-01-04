import { ethers } from 'hardhat';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = MigratorFactory.attach('0xD45f4D4292EC351f050fA05613d7023d2eed439d');
  let tx = await migrator.migrate(['0x0f45B42c42184cA3BdF3c261aD386B7f18Ef49aA'], [100000000000]);
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
