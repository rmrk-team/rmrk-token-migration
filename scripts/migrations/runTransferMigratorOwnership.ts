import { ethers, network } from 'hardhat';
import { MOONBEAM_MIGRATOR_ADDRESS, getMultiSigAddress } from '../utils';

async function main() {
  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = MigratorFactory.attach(MOONBEAM_MIGRATOR_ADDRESS);
  const multisigAddress = await getMultiSigAddress();
  console.log(
    `Transferring ownership of Migrator on ${network.name} at ${migrator.address} to ${multisigAddress}`,
  );

  const tx = await migrator.transferOwnership(multisigAddress);
  await tx.wait();
  console.log('Ownership transferred to multisig');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
