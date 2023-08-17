import { ethers } from 'hardhat';
import { Migrator, MoonriverMigrator, RMRK } from '../typechain-types';

async function deployNewRmrkAndMigrator(
  legacyRMRK: string,
): Promise<{ rmrk: RMRK; migrator: Migrator }> {
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = await RMRKFactory.deploy();
  await rmrk.deployed();

  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = await MigratorFactory.deploy(legacyRMRK, rmrk.address);
  await migrator.deployed();

  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), migrator.address);

  return { rmrk, migrator };
}

async function deployMooriverMigrator(legacyRMRK: string): Promise<MoonriverMigrator> {
  const MoonriverMigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const moonriverMigrator = await MoonriverMigratorFactory.deploy(legacyRMRK);
  await moonriverMigrator.deployed();

  return moonriverMigrator;
}

export { deployNewRmrkAndMigrator, deployMooriverMigrator };
