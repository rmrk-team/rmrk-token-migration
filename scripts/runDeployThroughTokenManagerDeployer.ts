import { ethers } from 'hardhat';
import { MockITS, TokenManagerDeployer } from '../typechain-types';

const TokenManagerType_MINT_BURN = 1;

async function main() {
  const itsFactory = await ethers.getContractFactory('MockITS');
  const its = <MockITS>itsFactory.attach('0xF786e21509A9D50a9aFD033B5940A2b7D872C208');

  const RMRKAddress = '0xF99ef080356f05b8E7aee17dFedaa57D926DD509';

  const tokenManagerDeployerFactory = await ethers.getContractFactory('TokenManagerDeployer');
  const tokenManagerDeployer = <TokenManagerDeployer>(
    tokenManagerDeployerFactory.attach('0x6aa459645b696108894c7548a898192e4716ef15')
  );

  const deployer = (await ethers.getSigners())[0];
  console.log('Deploying Remote Token Manager with the account:', deployer.address);

  const salt = ethers.constants.HashZero;
  const tokenId = await its.getCustomTokenId(deployer.address, salt);
  const addressAsBytes = ethers.utils.defaultAbiCoder.encode(['address'], [deployer.address]);
  const params = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'address'],
    [addressAsBytes, RMRKAddress],
  );

  let tx = await tokenManagerDeployer.deployTokenManager(
    tokenId,
    TokenManagerType_MINT_BURN,
    params,
  );
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
