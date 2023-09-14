import { ADMINS, deployNewRmrkAndMigrator } from './deploy';
import { run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { getLegacyRMRKAddress } from './utils';

async function main() {
  console.log('Deploying RMRK token and Migrator');
  const legacyRMRKAddress = '0xBF41e5Ff98186E6d66864a25124b99abC7dE331F'; // await getLegacyRMRKAddress();
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
    constructorArguments: [legacyRMRKAddress, rmrk.address],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
