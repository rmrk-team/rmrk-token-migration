import { ethers } from 'hardhat';
import { InterchainTokenService, RMRK } from '../typechain-types';

const TokenManagerType_MINT_BURN = 0;

async function main() {
  const itsFactory = await ethers.getContractFactory('InterchainTokenService');
  const tokenManagerFactory = await ethers.getContractFactory('TokenManagerMintBurn');
  const RMRKFactory = await ethers.getContractFactory('RMRK');

  const its = <InterchainTokenService>(
    itsFactory.attach('0xa4A9965149388c86E62CDDDd6C95EFe9c294005a')
  );
  // const rmrk = <RMRK>RMRKFactory.attach('0x760Ac3956f7253156aBF8BcdCb4d4e5b0e106eb1'); // Base Goerli
  const rmrk = <RMRK>RMRKFactory.attach('0x8f9d2a39AeB09A8e079442DF1a16044F0A3a14B5'); // Polygon Mumbai

  const deployer = (await ethers.getSigners())[0];
  console.log('Deploying Token Manager with the account:', deployer.address);

  const tokenManagerImplementationAddress = await its.tokenManagerImplementation(
    TokenManagerType_MINT_BURN,
  );
  console.log('Token Manager Implementation', tokenManagerImplementationAddress);
  const tokenManagerImplementation = tokenManagerFactory.attach(tokenManagerImplementationAddress);

  const salt = ethers.utils.id('RMRK1');
  const tokenId = await its.interchainTokenId(deployer.address, salt);
  const params = await tokenManagerImplementation.params(deployer.address, rmrk.address);
  console.log('Token ID', tokenId);
  console.log('Params', params);

  let tx = await its.deployTokenManager(salt, '', TokenManagerType_MINT_BURN, params, 0);
  await tx.wait();
  const tokenManagerAddress = await its.tokenManagerAddress(tokenId);
  console.log('Deployed Token Manager to ', tokenManagerAddress);

  await rmrk.setTokenManager(tokenManagerAddress);
  console.log('Set Token Manager to ', tokenManagerAddress);

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
