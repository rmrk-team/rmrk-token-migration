import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { task } from 'hardhat/config';
import generateMoonriverMigrationsTx from '../scripts/migrations/generateMoonriverMigrationsTx';
import { MoonriverMigrator } from '../typechain-types';

const MOONRIVER_MIGRATOR_ADDRESS = '0x45888288D054DBE4E3b0cc2577BE51F38E63F5E2'; // Cannot import from uils since it imports hardhat and task cannot do it

task(
  'getTxToStartMoonriverMigration',
  'Creates a migration file with holders and amounts to migrate for the given batch',
).setAction(async (params, hre: HardhatRuntimeEnvironment) => {
  await getTxToStartMoonriverMigration(hre.ethers);
});

async function getTxToStartMoonriverMigration(ethers: any) {
  const MigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = <MoonriverMigrator>MigratorFactory.attach(MOONRIVER_MIGRATOR_ADDRESS);
  await generateMoonriverMigrationsTx(migrator);
}
