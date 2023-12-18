import { ethers } from 'hardhat';
import { RMRK, InterchainTokenService } from '../typechain-types';

async function main() {
  const SEND_FROM_TOKEN = false; // Otherwise from ITS
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0x50320c6b3E971cEb0f6E756E5577b2514bb43E9D'); // Moonbase
  // const rmrk = <RMRK>RMRKFactory.attach('0xa65C304E56F5f97c8A4B3Ae79D721B9C1085F199'); // Polygon Mumbai

  const deployer = (await ethers.getSigners())[0];
  const destinationChain = 'Polygon';
  const destinationAddress = deployer.address;
  const valueToSend = ethers.utils.parseEther('5');
  const gas = ethers.utils.parseEther('0.51');
  console.log(
    `Sending ${ethers.utils.formatEther(valueToSend)} RMRK from ${deployer.address} to Polygon`,
  );

  if (SEND_FROM_TOKEN) {
    let tx = await rmrk.interchainTransfer(
      destinationChain,
      destinationAddress,
      valueToSend,
      [], // Empty metadata
      {
        value: gas,
      },
    );
    await tx.wait();
  } else {
    const tokenId = await rmrk.interchainTokenId();
    const itsAddress = await rmrk.interchainTokenService();

    const itsFactory = await ethers.getContractFactory('InterchainTokenService');
    const its = <InterchainTokenService>itsFactory.attach(itsAddress);

    let tx = await its.interchainTransfer(
      tokenId,
      destinationChain,
      destinationAddress, // Address as 'bytes'. Encoding not needed, will actually break it.
      valueToSend,
      [], // Empty metadata
      gas,
      { value: gas },
    );
    await tx.wait();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
