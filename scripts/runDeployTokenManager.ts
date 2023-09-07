import { ethers } from 'hardhat';
import { MockITS, RMRK } from '../typechain-types';

const TokenManagerType_MINT_BURN = 1;

async function main() {
  const itsFactory = await ethers.getContractFactory('MockITS');
  const its = <MockITS>itsFactory.attach('0xF786e21509A9D50a9aFD033B5940A2b7D872C208');

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0x87948a68f7A8add2411C3A958BA3Db8D18378e5B');

  const deployer = (await ethers.getSigners())[0];
  console.log('Deploying Token Manager with the account:', deployer.address);

  const salt = ethers.utils.id('RMRK');
  const tokenId = await its.getCustomTokenId(deployer.address, salt);
  console.log('Token ID', tokenId);
  const params = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'address'],
    [deployer.address, rmrk.address],
  );

  let tx = await its.deployCustomTokenManager(salt, TokenManagerType_MINT_BURN, params);
  await tx.wait();
  const tokenManagerAddress = await its.getTokenManagerAddress(tokenId);

  await rmrk.setTokenManager(tokenManagerAddress);

  console.log('Deployed Token Manager to ', tokenManagerAddress);

  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), tokenManagerAddress);
  console.log('Granted MINTER_ROLE to ', tokenManagerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
