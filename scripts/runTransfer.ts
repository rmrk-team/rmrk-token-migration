import { ethers } from 'hardhat';
import { RMRK, InterchainTokenService } from '../typechain-types';

async function main() {
  const SEND_FROM_TOKEN = false; // Otherwise from ITS
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0x7e5738bDabc8ADb3670b07eA0e7D4b0B94282E4f'); // TODO: Replace with right one
  const user = (await ethers.getSigners())[0];
  const destinationChain = 'Moonbeam';
  const destinationAddress = user.address;
  const valueToSend = ethers.utils.parseEther('3');
  const gas = ethers.utils.parseEther('0.5');
  console.log(
    `Sending ${ethers.utils.formatEther(valueToSend)} RMRK from ${
      user.address
    } to ${destinationAddress}`,
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
