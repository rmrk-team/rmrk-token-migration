import { ethers, network } from 'hardhat';
import { getMultiSigAddress, NEW_RMRK_ADDRESS } from '../utils';

async function main() {
  const rmrkFactory = await ethers.getContractFactory('RMRK');
  const rmrk = rmrkFactory.attach(NEW_RMRK_ADDRESS);
  const role = await rmrk.DEFAULT_ADMIN_ROLE();

  const multisigAddress = await getMultiSigAddress();
  console.log(
    `Granting admin of RMRK on ${network.name} at ${rmrk.address} to multisig at ${multisigAddress}`,
  );

  const tx = await rmrk.grantRole(role, multisigAddress);
  await tx.wait();
  console.log('Admin granted, use multisig to revoke admin to rmrk-minter account.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
