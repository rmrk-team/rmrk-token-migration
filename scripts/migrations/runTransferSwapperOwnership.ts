import { ethers, network } from 'hardhat';
import { getSwapperAddress, getMultiSigAddress } from '../utils';

async function main() {
  const SwapperMinterFactory = await ethers.getContractFactory('SwapperMinter');
  const swapperAddress = await getSwapperAddress();
  const multisigAddress = await getMultiSigAddress();
  console.log(
    `Transferring ownership of Swapper on ${network.name} at ${swapperAddress} to ${multisigAddress}`,
  );
  const swapper = SwapperMinterFactory.attach(swapperAddress);

  const tx = await swapper.transferOwnership(multisigAddress);
  await tx.wait();
  console.log('Ownership transferred');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
