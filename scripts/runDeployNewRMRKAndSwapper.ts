import { ADMINS, PAUSE_DELAY, deployNewRMRK, deploySwapperMinter } from './deploy';
import { ethers, run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { getLegacyRMRKAddress } from './utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer address: ', deployer.address);

  console.log('Deploying New RMRK and SwapperMinter');
  const legacyRMRKAddress = await getLegacyRMRKAddress();
  const rmrk = await deployNewRMRK();
  const swapperMinter = await deploySwapperMinter(legacyRMRKAddress, rmrk.address);

  console.log(`RMRK deployed to: ${rmrk.address}`);
  console.log(`SwapperMinter deployed to: ${swapperMinter.address}`);

  for (const admin of ADMINS) {
    let tx = await swapperMinter.setCanPause(admin, true);
    await tx.wait();
  }
  console.log('Added admins as valid pausers');

  console.log('Waiting 10 seconds before verifying...');
  delay(10000);

  await run('verify:verify', {
    address: rmrk.address,
    constructorArguments: [deployer.address],
  });

  await run('verify:verify', {
    address: swapperMinter.address,
    constructorArguments: [legacyRMRKAddress, rmrk.address, PAUSE_DELAY],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
