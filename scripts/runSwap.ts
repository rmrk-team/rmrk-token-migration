import { ethers } from 'hardhat';
import { RMRK, InterchainTokenService } from '../typechain-types';
import { NEW_RMRK_ADDRESS, getLegacyRMRKAddress } from './utils';

async function main() {
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const swapperMinterFactory = await ethers.getContractFactory('SwapperMinter');
  const legacyRMRKAddress = await getLegacyRMRKAddress();

  const newRMRK = <RMRK>RMRKFactory.attach(NEW_RMRK_ADDRESS);
  const legacyRMRK = <RMRK>RMRKFactory.attach(legacyRMRKAddress);
  const swapperMinter = swapperMinterFactory.attach('0x20C80a3069D5b51D7d4E40764eCd905000962E57');

  const [user] = await ethers.getSigners();
  const balance = await legacyRMRK.balanceOf(user.address);
  console.log('Balance:', balance);

  let tx = await legacyRMRK.connect(user).approve(swapperMinter.address, balance);
  await tx.wait();
  console.log('Approved');

  tx = await swapperMinter.connect(user).swapLegacyRMRK(balance.div(2), user.address);
  await tx.wait();
  console.log('Swapped');

  /// Transfer to 0xB51a3af7db506d762F0fb85187fb266f4eBAb01D
  tx = await newRMRK
    .connect(user)
    .transfer('0xB51a3af7db506d762F0fb85187fb266f4eBAb01D', balance.div(20));
  await tx.wait();
  console.log('Transferred');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
