import { ethers } from 'hardhat';
import { RMRK, TokenManagerMintBurn } from '../typechain-types';

async function main() {
  const SEND_FROM_TOKEN = true; // Otherwise from token manager
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0x760Ac3956f7253156aBF8BcdCb4d4e5b0e106eb1'); // Base Goerli
  // const rmrk = <RMRK>RMRKFactory.attach('0x8f9d2a39AeB09A8e079442DF1a16044F0A3a14B5'); // Polygon Mumbai

  const tokenManagerFactory = await ethers.getContractFactory('TokenManagerMintBurn');
  const tokenManager = <TokenManagerMintBurn>(
    tokenManagerFactory.attach('0x898D70faCF0dddb7DeCB4351c006988CC7d5E1b4')
  );

  const deployer = (await ethers.getSigners())[0];
  const destinationChain = 'Polygon';
  const destinationAddress = deployer.address;
  const valueToSend = ethers.utils.parseEther('5');
  const gas = ethers.utils.parseEther('0.01');
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
    let tx = await tokenManager.interchainTransfer(
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
