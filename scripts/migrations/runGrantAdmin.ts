import { ethers } from 'hardhat';

async function main() {
  const rmrkFactory = await ethers.getContractFactory('RMRK');
  const rmrk = rmrkFactory.attach('0x7e5738bDabc8ADb3670b07eA0e7D4b0B94282E4f'); // TODO: Change this to the correct migrator address
  const role = await rmrk.DEFAULT_ADMIN_ROLE();

  const tx = await rmrk.grantRole(role, '0x85Ab410A50A3D85f1a26d9e4eFCaa520a39B9CD6'); // TODO: Change this to the correct multisig address
  await tx.wait();
  console.log('Granted admin to multisig, use multisig to revoke admin to rmrk-minter account.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
