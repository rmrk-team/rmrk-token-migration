import { ethers } from 'hardhat';
import { RMRK, TokenManagerMintBurn } from '../typechain-types';

async function main() {
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0xFA92887AE658B7F9648cc68A191a6878BFfBce98');

  const tokenManagerFactory = await ethers.getContractFactory('TokenManagerMintBurn');
  const tokenManager = <TokenManagerMintBurn>tokenManagerFactory.attach('0x08b5bdCF996b8EaE87fAC01553434e9f5e93a8ff');

  const deployer = (await ethers.getSigners())[0];
  const value = ethers.utils.parseEther('1');
  console.log(
    `Sending ${ethers.utils.formatEther(value)} RMRK from ${deployer.address} to Polygon`,
  );

  // let tx = await tokenManager.sendToken(
  //   'Polygon',
  //   deployer.address,
  //   ethers.utils.parseEther('0.0001'),
  //   ethers.constants.HashZero,
  //   { value: ethers.utils.parseEther('2') },
  // );
  // await tx.wait();

  console.log('Current balance: ', await rmrk.balanceOf(deployer.address));

  let tx = await rmrk.interchainTransfer(
    'Polygon',
    ethers.utils.defaultAbiCoder.encode(['bytes'], [deployer.address]),
    1,
    ethers.constants.HashZero,
    { value: ethers.utils.parseEther('2') },
  );
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
