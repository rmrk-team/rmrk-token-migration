import { ADMINS, PAUSE_DELAY, deployNewRMRK, deploySwapperMinter } from './deploy';
import { ethers, run } from 'hardhat';
import { getLegacyRMRKAddress, getMultiSigAddress, NEW_RMRK_ADDRESS } from './utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer address: ', deployer.address);

  console.log('Deploying SwapperMinter');
  const legacyRMRKAddress = await getLegacyRMRKAddress();
  console.log(`Deploying SwapperMinter with legacyRMRKAddress: ${legacyRMRKAddress}`);
  const swapperMinter = await deploySwapperMinter(legacyRMRKAddress, NEW_RMRK_ADDRESS);
  console.log(`SwapperMinter deployed to: ${swapperMinter.address}`);

  for (const admin of ADMINS) {
    let tx = await swapperMinter.setCanPause(admin, true);
    await tx.wait();
  }
  console.log('Added admins as valid pausers');

  const multisigAddress = await getMultiSigAddress();
  let tx = await swapperMinter.transferOwnership(multisigAddress);
  await tx.wait();
  console.log(
    `SwapperMinter ownership transferred to multisig: ${multisigAddress}, add minting permissions to it!`,
  );

  await run('verify:verify', {
    address: swapperMinter.address,
    constructorArguments: [legacyRMRKAddress, NEW_RMRK_ADDRESS, PAUSE_DELAY],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
