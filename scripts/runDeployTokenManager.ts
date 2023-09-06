import { ethers } from 'hardhat';
import { MockITS, RMRK } from '../typechain-types';

const TokenManagerType_MINT_BURN = 1;

async function main() {
  const itsFactory = await ethers.getContractFactory('MockITS');
  const its = <MockITS>itsFactory.attach('0xF786e21509A9D50a9aFD033B5940A2b7D872C208')

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = <RMRK>RMRKFactory.attach('0xCAa7Ba4F267d7CB5Caf6A762dAc5ad9A9ce3Ea3F');

  const deployer = (await ethers.getSigners())[0];
  console.log('Deploying Token Manager with the account:', deployer.address);

  const tokenId = await its.getCanonicalTokenId(rmrk.address);
  console.log('Token ID', tokenId);

  let tx = await its.registerCanonicalToken(rmrk.address);
  await tx.wait();
  console.log('Registered RMRK contract');

  const tokenManagerAddress = await its.getTokenManagerAddress(tokenId);

  console.log('Deployed Token Manager to ', tokenManagerAddress);

  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), tokenManagerAddress);
  console.log('Granted MINTER_ROLE to ', tokenManagerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
