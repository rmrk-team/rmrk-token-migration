import { ethers } from 'hardhat';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = MigratorFactory.attach('0x2C79B64d30aB121f24B98cc44E2393A7cBb201f6'); // TODO: Change this to the correct address

  const tx = await migrator.transferOwnership('0x85Ab410A50A3D85f1a26d9e4eFCaa520a39B9CD6');
  await tx.wait();
  console.log('Ownership transferred to multisig');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
