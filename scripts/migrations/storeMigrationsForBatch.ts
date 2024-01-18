import { MoonriverMigrator } from '../../typechain-types';

export default async function storeMigrationsForBatch(migrator: MoonriverMigrator, batch: number) {
  const [holders, amounts] = await migrator.getMigrationsForBatch(batch);
  const output = {
    version: '1.0',
    chainId: '1284',
    createdAt: (new Date().getTime() / 1000) | 0,
    meta: {
      name: 'Transactions Batch',
      description: '',
      txBuilderVersion: '1.16.1',
      createdFromSafeAddress: '0x85Ab410A50A3D85f1a26d9e4eFCaa520a39B9CD6',
      createdFromOwnerAddress: '',
      checksum: '0x6f40d4629d1ef4bb6104abc25344f0e798e1b240e882e499a13d1046cd8efa23',
    },
    transactions: [
      {
        to: '0xbcdeFe4BeF75cf2AC1a7BBDC88bB153F1B19DB65',
        value: '0',
        data: null,
        contractMethod: {
          inputs: [
            { internalType: 'uint256', name: 'batch', type: 'uint256' },
            { internalType: 'address[]', name: 'tos', type: 'address[]' },
            { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
          ],
          name: 'migrate',
          payable: false,
        },
        contractInputsValues: {
          batch: `${batch}`,
          tos: JSON.stringify(holders),
          amounts: JSON.stringify(amounts.map((bn) => bn.toNumber())),
        },
      },
    ],
  };
  const fs = require('fs');
  // Create migration scripts folder if it doesn't exist
  const migrationsDir = './migrations';
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir);
  }
  const dataPath = `${migrationsDir}/${batch}.json`;
  fs.writeFileSync(dataPath, JSON.stringify(output, null, 2));
  console.log(`Wrote migration data to ${dataPath}`);
}
