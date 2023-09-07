import { ethers } from 'hardhat';

async function main() {
  const itsFactory = await ethers.getContractFactory('MockITS');
  const its = await itsFactory.deploy();

  const deployer = (await ethers.getSigners())[0];
  const RMRKAddress = '0xF99ef080356f05b8E7aee17dFedaa57D926DD509';
  const addressAsBytes = ethers.utils.defaultAbiCoder.encode(['address'], [deployer.address]);
  console.log(addressAsBytes);
  const params = ethers.utils.defaultAbiCoder.encode(
    ['bytes', 'address'],
    [ethers.constants.HashZero, RMRKAddress],
  );
  const address = await its.setup(params);
  console.log(address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
