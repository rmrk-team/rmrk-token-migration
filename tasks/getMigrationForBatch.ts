import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { task } from 'hardhat/config';
import storeMigrationsForBatch from '../scripts/migrations/storeMigrationsForBatch';
import { MoonriverMigrator } from '../typechain-types';

const MOONRIVER_MIGRATOR_ADDRESS = '0x923C768AC53B24a188333f3709b71cB343DB20b2'; // Cannot import from uils since it imports hardhat and task cannot do it
enum State {
  NotStarted,
  Started,
  Migrating,
  Finished,
}

task(
  'getMigrationForBatch',
  'Creates a migration file with holders and amounts to migrate for the given batch',
)
  .addPositionalParam('batch')
  .setAction(async (params, hre: HardhatRuntimeEnvironment) => {
    await getMigrationForBatch(parseInt(params['batch']), hre.ethers);
  });

async function getMigrationForBatch(batch: number, ethers: any) {
  const MigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const migrator = <MoonriverMigrator>MigratorFactory.attach(MOONRIVER_MIGRATOR_ADDRESS);
  const batchState = await migrator.batchState(batch);
  if (batchState !== State.Migrating && batchState !== State.Finished) {
    console.log(`Batch ${batch} has not started migrating yet`);
    return;
  }
  await storeMigrationsForBatch(migrator, batch);
}
