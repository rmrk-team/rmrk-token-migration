import { ADMINS, PAUSE_DELAY, deployNewRmrkAndMigrator } from './deploy';
import { run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { getLegacyRMRKAddress } from './utils';

async function main() {
  console.log('Deploying RMRK token and Migrator');
  const legacyRMRKAddress = '0x44950583ed6e313f2A13c73211D8039226f82429'; // await getLegacyRMRKAddress();
  const { rmrk, migrator } = await deployNewRmrkAndMigrator(legacyRMRKAddress);

  console.log(`RMRK deployed to: ${rmrk.address}`);
  console.log(`Migrator deployed to: ${migrator.address}`);

  for (const admin of ADMINS) {
    let tx = await migrator.setCanPause(admin, true);
    await tx.wait();
  }
  console.log('Added admins as valid pausers');

  console.log('Waiting 10 seconds before verifying...');
  delay(10000);

  await run('verify:verify', {
    address: rmrk.address,
    constructorArguments: [],
  });
  await run('verify:verify', {
    address: migrator.address,
    constructorArguments: [legacyRMRKAddress, rmrk.address, PAUSE_DELAY],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
