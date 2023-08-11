import { ethers } from 'hardhat';
import { Migrator, RMRK } from '../typechain-types';

export async function deployContracts(
  legacyRMRK: string,
): Promise<{ rmrk: RMRK; migrator: Migrator }> {
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = await RMRKFactory.deploy();
  await rmrk.deployed();

  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = await MigratorFactory.deploy(legacyRMRK, rmrk.address);
  await migrator.deployed();

  return { rmrk, migrator };
}
