import { ethers, network } from 'hardhat';
import { MOONRIVER_MIGRATOR_ADDRESS, getMultiSigAddress } from '../utils';

async function main() {
  const MoonriverMigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const moonriverMigrator = MoonriverMigratorFactory.attach(MOONRIVER_MIGRATOR_ADDRESS);
  const multisigAddress = await getMultiSigAddress();
  console.log(
    `Transferring ownership of MoonriverMigrator on ${network.name} at ${moonriverMigrator.address} to ${multisigAddress}`,
  );

  const tx = await moonriverMigrator.transferOwnership(multisigAddress);
  await tx.wait();
  console.log('Ownership transferred');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
