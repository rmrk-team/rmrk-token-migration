import { ethers } from 'hardhat';
import { MockITS, RMRK } from '../typechain-types';

const TokenManagerType_MINT_BURN = 1;

async function main() {
  const itsFactory = await ethers.getContractFactory('MockITS');
  const its = <MockITS>itsFactory.attach('0xF786e21509A9D50a9aFD033B5940A2b7D872C208');

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0xF99ef080356f05b8E7aee17dFedaa57D926DD509');

  const deployer = (await ethers.getSigners())[0];
  console.log('Deploying Remote Token Manager with the account:', deployer.address);

  const salt = ethers.constants.HashZero;
  const addressAsBytes = ethers.utils.defaultAbiCoder.encode(['address'], [deployer.address]);
  const params = await its.getParamsMintBurn(addressAsBytes, rmrk.address);

  const tokenId = await its.getCustomTokenId(deployer.address, salt);
  console.log('Token ID', tokenId);

  const gasValue = ethers.utils.parseEther('1');
  await its.deployRemoteCustomTokenManager(
    salt,
    'polygon',
    TokenManagerType_MINT_BURN,
    params,
    gasValue,
    { value: gasValue },
  );
  const tokenManagerAddress = await its.getTokenManagerAddress(tokenId);

  console.log('Deployed Remote Token Manager to', tokenManagerAddress);

  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), tokenManagerAddress);
  console.log('Granted MINTER_ROLE to', tokenManagerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
