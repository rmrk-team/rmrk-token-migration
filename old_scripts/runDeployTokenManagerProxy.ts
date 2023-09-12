import { ethers } from 'hardhat';
import { MockITS } from '../typechain-types';

const TokenManagerType_MINT_BURN = 1;

async function main() {
  const itsFactory = await ethers.getContractFactory('MockITS');
  const its = <MockITS>itsFactory.attach('0xF786e21509A9D50a9aFD033B5940A2b7D872C208');

  const RMRKAddress = '0xF99ef080356f05b8E7aee17dFedaa57D926DD509';
  const deployer = (await ethers.getSigners())[0];
  const salt = ethers.constants.HashZero;
  const tokenId = await its.getCustomTokenId(deployer.address, salt);
  const params = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'address'],
    [ethers.constants.HashZero, RMRKAddress],
  );
  const tokenManagerProxyFactory = await ethers.getContractFactory('TokenManagerProxy');
  const tokenManagerProxy = await tokenManagerProxyFactory.deploy(
    its.address,
    TokenManagerType_MINT_BURN,
    tokenId,
    params,
  );
  await tokenManagerProxy.deployed();
  console.log('Deployed Token Manager Proxy to ', tokenManagerProxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
