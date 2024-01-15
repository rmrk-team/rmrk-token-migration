import { ethers } from 'hardhat';

async function main() {
  const rmrkFactory = await ethers.getContractFactory('RMRK');
  const rmrk = rmrkFactory.attach('0x7e5738bDabc8ADb3670b07eA0e7D4b0B94282E4f'); // TODO: Change this to the correct migrator address
  const role = await rmrk.MINTER_ROLE();
  let tx = await rmrk.revokeRole(role, '0x2C79B64d30aB121f24B98cc44E2393A7cBb201f6'); // TODO: Change this to the correct migrator address
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
