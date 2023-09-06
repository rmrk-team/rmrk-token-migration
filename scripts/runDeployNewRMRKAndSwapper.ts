import { deployNewRMRK, deploySwapperMinter } from './deploy';
import { run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { getLegacyRMRKAddress } from './utils';

async function main() {
  console.log('Deploying New RMRK');
  const legacyRMRKAddress = await getLegacyRMRKAddress();
  const rmrk = await deployNewRMRK();
  const swapperMinter = await deploySwapperMinter(legacyRMRKAddress, rmrk.address);
  console.log(`RMRK deployed to: ${rmrk.address}`);
  console.log(`SwapperMinter deployed to: ${swapperMinter.address}`);

  delay(5000);

  await run('verify:verify', {
    address: rmrk.address,
    constructorArguments: [],
  });

  await run('verify:verify', {
    address: swapperMinter.address,
    constructorArguments: [legacyRMRKAddress, rmrk.address],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
