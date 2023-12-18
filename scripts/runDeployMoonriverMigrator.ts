import { deployMoonriverMigrator } from './deploy';
import { run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { getLegacyRMRKAddress } from './utils';

async function main() {
  console.log('Deploying Moonriver Migrator');
  const legacyRMRKAddress = await getLegacyRMRKAddress();
  const moonriverMigrator = await deployMoonriverMigrator(legacyRMRKAddress);

  console.log(`Moonriver Migrator to: ${moonriverMigrator.address}`);

  delay(10000);

  await run('verify:verify', {
    address: moonriverMigrator.address,
    constructorArguments: [legacyRMRKAddress],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
