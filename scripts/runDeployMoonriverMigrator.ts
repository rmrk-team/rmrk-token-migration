import { deployMoonriverMigrator } from './deploy';
import { run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { getLegacyRMRKAddress } from './utils';

async function main() {
  console.log('Deploying Moonriver Migrator');
  const legacyRMRKAddress = '0x6f5BCEE387da9D44d6E16E46095D50F9c6006e80'; // await getLegacyRMRKAddress();
  const moonriverMigrator = await deployMoonriverMigrator(legacyRMRKAddress);

  console.log(`Moonriver Migrator to: ${moonriverMigrator.address}`);

  delay(5000);

  await run('verify:verify', {
    address: moonriverMigrator.address,
    constructorArguments: [legacyRMRKAddress],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
