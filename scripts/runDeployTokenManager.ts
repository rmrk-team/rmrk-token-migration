import { ethers } from 'hardhat';
import { InterchainTokenService, RMRK } from '../typechain-types';

const TokenManagerType_MINT_BURN = 0;

async function main() {
  const itsFactory = await ethers.getContractFactory('InterchainTokenService');
  const tokenManagerFactory = await ethers.getContractFactory('TokenManager');
  const RMRKFactory = await ethers.getContractFactory('RMRK');

  const its = <InterchainTokenService>(
    itsFactory.attach('0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C')
  );
  const rmrk = <RMRK>RMRKFactory.attach('0xa65C304E56F5f97c8A4B3Ae79D721B9C1085F199'); // Mumbai
  // const rmrk = <RMRK>RMRKFactory.attach('0x50320c6b3E971cEb0f6E756E5577b2514bb43E9D'); // Moonbase

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
  await rmrk.setTokenIdAndIts(tokenId, its.address);
  console.log('Set TokenId and ITs on RMRK token');

  tx = await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), its.address);
  await tx.wait();
  tx = await rmrk.grantRole(ethers.utils.id('BURNER_ROLE'), its.address);
  await tx.wait();
  console.log('Granted MINTER_ROLE and BURNER_ROLE to ITS:', its.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
