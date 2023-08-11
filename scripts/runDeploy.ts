import { deployContracts } from '../scripts/deploy';

const LEGACY_RMRK = '0x3Ff3B0361B450E70729006918c14DEb6Da410349'; // Moonbase

async function main() {
  console.log('Deploying RMRK token and Migrator');
  const { rmrk, migrator } = await deployContracts(LEGACY_RMRK);

  console.log(`RMRK deployed to: ${rmrk.address}`);
  console.log(`Migrator deployed to: ${migrator.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
