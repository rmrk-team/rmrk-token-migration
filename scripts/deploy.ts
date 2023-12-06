import { ethers } from 'hardhat';
import {
  LegacyRMRK,
  Migrator,
  MoonriverMigrator,
  RMRK,
  Swapper,
  SwapperMinter,
} from '../typechain-types';

async function deployNewRmrkAndMigrator(
  legacyRMRK: string,
): Promise<{ rmrk: RMRK; migrator: Migrator }> {
  const [deployer] = await ethers.getSigners();
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = await RMRKFactory.deploy(deployer.address);
  await rmrk.deployed();

  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = await MigratorFactory.deploy(legacyRMRK, rmrk.address, PAUSE_DELAY);
  await migrator.deployed();

  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), migrator.address);

  return { rmrk, migrator };
}

async function deployMoonriverMigrator(legacyRMRK: string): Promise<MoonriverMigrator> {
  const MoonriverMigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const moonriverMigrator = await MoonriverMigratorFactory.deploy(legacyRMRK);
  await moonriverMigrator.deployed();

  return moonriverMigrator;
}

async function deployNewRMRK(): Promise<RMRK> {
  const [deployer] = await ethers.getSigners();
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = await RMRKFactory.deploy(deployer.address);
  await rmrk.deployed();

  return rmrk;
}

async function deployLegacyRMRK(): Promise<LegacyRMRK> {
  const legacyRMRKFactory = await ethers.getContractFactory('LegacyRMRK');
  const legacyRMRK = await legacyRMRKFactory.deploy();
  await legacyRMRK.deployed();

  return legacyRMRK;
}

async function deploySwapper(legacyRMRK: string, newRMRK: string): Promise<Swapper> {
  const swapperFactory = await ethers.getContractFactory('Swapper');
  const swapper = await swapperFactory.deploy(legacyRMRK, newRMRK);
  await swapper.deployed();

  return swapper;
}

async function deploySwapperMinter(legacyRMRK: string, newRMRK: string): Promise<SwapperMinter> {
  const swapperMinterFactory = await ethers.getContractFactory('SwapperMinter');
  const swapperMinter = await swapperMinterFactory.deploy(legacyRMRK, newRMRK, PAUSE_DELAY);
  await swapperMinter.deployed();

  return swapperMinter;
}

const ADMINS = [
  '0xfbea1b97406C6945D07F50F588e54144ea8B684f', //YP
  '0x0f45B42c42184cA3BdF3c261aD386B7f18Ef49aA', //YG
  '0x98Df228716b90d21868A10309453c774719e2C2e', //IO
  '0xA6cc9397d29b631b69782e5F7fB9801224C8FA90', //SP
];

const PAUSE_DELAY = 3600 * 24 * 7; // A week

export {
  deployNewRmrkAndMigrator,
  deployMoonriverMigrator,
  deployNewRMRK,
  deployLegacyRMRK,
  deploySwapper,
  deploySwapperMinter,
  ADMINS,
  PAUSE_DELAY,
};
