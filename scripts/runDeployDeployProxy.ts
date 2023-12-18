import { deployDeployProxy } from './deploy';
import { network, run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';

async function main() {
  const deployProxy = await deployDeployProxy();

  console.log(`DeployProxy deployed to: ${deployProxy.address}`);

  if (network.name !== 'hardhat') {
    console.log('Waiting for 10 seconds before verifying...');
    await delay(10000);

    try {
      await run('verify:verify', {
        address: deployProxy.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log(error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
