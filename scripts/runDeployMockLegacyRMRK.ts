import { deployLegacyRMRK, ADMINS } from './deploy';
import { ethers, run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';

async function main() {
  console.log('Deploying Legacy RMRK');
  const legacyRMRK = await deployLegacyRMRK();

  console.log(`Legacy RMRK deployed to: ${legacyRMRK.address}`);
  delay(5000);

  for (const admin of ADMINS) {
    await legacyRMRK.mint(admin, ethers.utils.parseUnits('1000', 10));
  }

  await run('verify:verify', {
    address: legacyRMRK.address,
    constructorArguments: [],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
