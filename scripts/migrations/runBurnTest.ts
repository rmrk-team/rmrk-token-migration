import { ethers } from 'hardhat';
import { MOONRIVER_MIGRATOR_ADDRESS } from '../utils';
import { LegacyRMRK } from '../../typechain-types';

async function main() {
  const LegacyRMRKFactory = await ethers.getContractFactory('LegacyRMRK');
  const legacyRMRK = <LegacyRMRK>(
    LegacyRMRKFactory.attach('0xffffffFF893264794d9d57E1E0E21E0042aF5A0A')
  );
  let tx = await legacyRMRK.burn(ethers.utils.parseUnits('0.01', 10));
  await tx.wait();
  // let tx = await migrator.finishBatch(previousBatch);
  // await tx.wait();
  // console.log(`Finished migrating batch ${previousBatch}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
