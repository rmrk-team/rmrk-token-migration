import { ethers } from 'hardhat';
import { MockITS, RMRK } from '../typechain-types';

const TokenManagerType_MINT_BURN = 0;

async function main() {
  const itsFactory = await ethers.getContractFactory('MockITS');
  const its = <MockITS>itsFactory.attach('0xF786e21509A9D50a9aFD033B5940A2b7D872C208');

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0xbB59657c3B088358Ad50Cf4b644441142E383708');

  const deployer = (await ethers.getSigners())[0];
  console.log('Deploying Token Manager with the account:', deployer.address);

  const salt = ethers.utils.id('RMRK');
  const tokenId = await its.interchainTokenId(deployer.address, salt);
  console.log('Token ID', tokenId);
  const params = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'address'],
    [deployer.address, rmrk.address],
  );

  let tx = await its.deployTokenManager(salt, '', TokenManagerType_MINT_BURN, params, 0);
  await tx.wait();
  const tokenManagerAddress = await its.tokenManagerAddress(tokenId);

  await rmrk.setTokenManager(tokenManagerAddress);

  console.log('Deployed Token Manager to ', tokenManagerAddress);

  tx = await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), tokenManagerAddress);
  await tx.wait();
  tx = await rmrk.grantRole(ethers.utils.id('BURNER_ROLE'), tokenManagerAddress);
  await tx.wait();
  console.log('Granted MINTER_ROLE and BURNER_ROLE to ', tokenManagerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
