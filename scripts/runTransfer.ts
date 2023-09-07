import { ethers } from 'hardhat';
import { RMRK } from '../typechain-types';

async function main() {
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0x9cc645C8a335e5615b44D170F4E8a1b671cA41b3');

  const deployer = (await ethers.getSigners())[0];
  const value = ethers.utils.parseEther('1');
  console.log(
    `Sending ${ethers.utils.formatEther(value)} RMRK from ${deployer.address} to Polygon`,
  );

  let tx = await rmrk.interchainTransfer(
    'Polygon',
    ethers.utils.defaultAbiCoder.encode(['bytes'], [deployer.address]),
    ethers.utils.parseEther('1'),
    ethers.constants.HashZero,
    { value: ethers.utils.parseEther('2') },
  );
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
