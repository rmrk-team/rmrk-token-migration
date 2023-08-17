import { deployContracts } from '../scripts/deploy';
import { ethers } from 'hardhat';


const LEGACY_RMRK = '0x3Ff3B0361B450E70729006918c14DEb6Da410349'; // Moonbase
const RMRK = '0x95B3698D858A4a380F88eB36AEee35968d793c03';
const MIGRATOR = '0x398536b79D8B32740007b12Cd8eA9842f2355052';

async function main() {
  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const rmrk = RMRKFactory.attach(RMRK);
  const migrator = MigratorFactory.attach(MIGRATOR);

  // let tx = await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), migrator.address);
  // await tx.wait();

  // let tx = await migrator.migrate(['0xA6cc9397d29b631b69782e5F7fB9801224C8FA90'], [ethers.utils.parseUnits('100', 10)]);
  // await tx.wait();
  console.log(await rmrk.balanceOf('0xA6cc9397d29b631b69782e5F7fB9801224C8FA90'));

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
