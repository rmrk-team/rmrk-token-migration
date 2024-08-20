import { ethers, network, run } from 'hardhat';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';
import { NEW_RMRK_ADDRESS } from './utils';
import { RMRK } from '../typechain-types';

async function main() {
  const MAX_BALANCE_TO_CLAIM = ethers.utils.parseEther('1');
  const MINT_AMOUNT = ethers.utils.parseEther('10');
  const faucetFactory = await ethers.getContractFactory('TestFaucet');
  const faucet = await faucetFactory.deploy(NEW_RMRK_ADDRESS, MAX_BALANCE_TO_CLAIM, MINT_AMOUNT);
  await faucet.deployed();

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach(NEW_RMRK_ADDRESS);
  let tx = await rmrk.grantRole(await rmrk.MINTER_ROLE(), faucet.address);
  await tx.wait();

  console.log(`DeployProxy deployed to: ${faucet.address}`);

  if (network.name !== 'hardhat') {
    console.log('Waiting for 10 seconds before verifying...');
    await delay(10000);

    try {
      await run('verify:verify', {
        address: faucet.address,
        constructorArguments: [NEW_RMRK_ADDRESS, MAX_BALANCE_TO_CLAIM, MINT_AMOUNT],
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
