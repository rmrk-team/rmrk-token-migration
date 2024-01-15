import { deployNewRMRK } from './deploy';
import { ethers, run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer address: ', deployer.address);

  console.log('Deploying New RMRK');
  const rmrk = await deployNewRMRK();
  console.log(`RMRK deployed to: ${rmrk.address}`);

  console.log('Waiting 10 seconds before verifying...');
  await delay(10000);

  await run('verify:verify', {
    address: rmrk.address,
    constructorArguments: [],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
