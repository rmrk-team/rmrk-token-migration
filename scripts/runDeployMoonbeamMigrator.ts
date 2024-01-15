import { ADMINS, PAUSE_DELAY } from './deploy';
import { ethers, run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { getLegacyRMRKAddress, NEW_RMRK_ADDRESS } from './utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer address: ', deployer.address);

  console.log('Deploying RMRK token and Migrator');
  const legacyRMRKAddress = await getLegacyRMRKAddress();
  const MigratorFactory = await ethers.getContractFactory('Migrator');

  const migrator = await MigratorFactory.deploy(legacyRMRKAddress, NEW_RMRK_ADDRESS, PAUSE_DELAY);
  await migrator.deployed();

  console.log(`Migrator deployed to: ${migrator.address}`);

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = RMRKFactory.attach(NEW_RMRK_ADDRESS);
  let tx = await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), migrator.address);
  await tx.wait();
  console.log(`Minter role granted to: ${migrator.address}`);

  for (const admin of ADMINS) {
    let tx = await migrator.setCanPause(admin, true);
    await tx.wait();
  }
  console.log('Added admins as valid pausers');

  console.log('Waiting 10 seconds before verifying...');
  await delay(10000);

  await run('verify:verify', {
    address: migrator.address,
    constructorArguments: [legacyRMRKAddress, rmrk.address, PAUSE_DELAY],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
