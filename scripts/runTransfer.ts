import { ethers } from 'hardhat';
import { RMRK, TokenManagerMintBurn } from '../typechain-types';

async function main() {
  const SEND_FROM_TOKEN = true; // Otherwise from token manager
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0xFA92887AE658B7F9648cc68A191a6878BFfBce98');

  const tokenManagerFactory = await ethers.getContractFactory('TokenManagerMintBurn');
  const tokenManager = <TokenManagerMintBurn>tokenManagerFactory.attach('0x08b5bdCF996b8EaE87fAC01553434e9f5e93a8ff');

  const deployer = (await ethers.getSigners())[0];
  const destinationChain = 'Polygon';
  const destinationAddress = deployer.address;
  const valueToSend = ethers.utils.parseEther('5');
  const gas = ethers.utils.parseEther('1');
  console.log(
    `Sending ${ethers.utils.formatEther(valueToSend)} RMRK from ${deployer.address} to Polygon`,
  );

  if (SEND_FROM_TOKEN) {
    let tx = await rmrk.interchainTransfer(
      destinationChain,
      destinationAddress,
      valueToSend,
      { value: gas },
    );
    await tx.wait();
  } else {

    let tx = await tokenManager.sendToken(
      destinationChain,
      destinationAddress, // Address as 'bytes'. Encoding not needed, will actually break it.
      valueToSend,
      [], // Empty metadata
      { value: gas },
    );
    await tx.wait();

  }

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
