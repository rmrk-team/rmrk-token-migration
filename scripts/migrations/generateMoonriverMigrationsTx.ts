import { MoonriverMigrator } from '../../typechain-types';

export default async function generateMoonriverMigrationsTx(migrator: MoonriverMigrator) {
  const currentBatch = (await migrator.currentBatch()).toNumber();
  console.log(`Generating tx to start migration for batch ${currentBatch}`);
  const output = {
    version: '1.0',
    chainId: '1285',
    createdAt: 1705593615045,
    meta: {
      name: 'Transactions Batch',
      description: '',
      txBuilderVersion: '1.16.1',
      createdFromSafeAddress: '0x7e8421b873429eE58A06055E89CD0DBeF51784F0',
      createdFromOwnerAddress: '',
      checksum: '0x3a3c118fb680d563c19d228f75db71b9dcece958855ef39f4a18c34241b324fd',
    },
    transactions: [
      {
        to: '0x923C768AC53B24a188333f3709b71cB343DB20b2',
        value: '0',
        data: null,
        contractMethod: {
          inputs: [{ internalType: 'uint256', name: 'batch', type: 'uint256' }],
          name: 'finishBatch',
          payable: false,
        },
        contractInputsValues: { batch: (currentBatch - 1).toString() },
      },
      {
        to: '0x923C768AC53B24a188333f3709b71cB343DB20b2',
        value: '0',
        data: null,
        contractMethod: {
          inputs: [{ internalType: 'uint256', name: 'batch', type: 'uint256' }],
          name: 'startMigratingBatch',
          payable: false,
        },
        contractInputsValues: { batch: currentBatch.toString() },
      },
      {
        to: '0x923C768AC53B24a188333f3709b71cB343DB20b2',
        value: '0',
        data: null,
        contractMethod: {
          inputs: [],
          name: 'startNextBatch',
          payable: false,
        },
        contractInputsValues: null,
      },
    ],
  };

  const fs = require('fs');
  // Create migration scripts folder if it doesn't exist
  const migrationsDir = './migration-start';
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir);
  }
  const dataPath = `${migrationsDir}/${currentBatch}.json`;
  fs.writeFileSync(dataPath, JSON.stringify(output, null, 2));
  console.log(`Wrote start migration data to ${dataPath}`);
}
