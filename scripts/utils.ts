import { ethers } from 'hardhat';

async function getLegacyRMRKAddress() {
  const chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
  if (chainId === 1287 || chainId === 31337)
    // Moonbase Alpha or Hardhat
    return '0x3Ff3B0361B450E70729006918c14DEb6Da410349';
  else if (chainId === 1285)
    // Moonriver
    return '0xffffffFF893264794d9d57E1E0E21E0042aF5A0A';
  else if (chainId === 1284)
    // Moonbeam
    return '0xECf2ADafF1De8A512f6e8bfe67a2C836EDb25Da3';
  else if (chainId === 11155111)
    // Sepolia
    return '0x487E83179fF7472edE739DE640D8Df7DeB43Ee08';
  else if (chainId === 80001)
    // Mumbai
    return '0x4C6C8805Ba067ee772B2E4b97C91cd5301cDA83b';
  else if (chainId === 84531)
    // Base Goerli
    return '0x1D23Dc7fAA18BD7CeEA9383E10598d455adbe836';
  else if (chainId === 1)
    // Ethereum
    return '0x471ea49dd8e60e697f4cac262b5fafcc307506e4';
  else if (chainId === 137)
    // Polygon
    return '0xd225eAD1Ce2554F6CB519894Fc98cFB882566339';
  else if (chainId === 592)
    // Astar
    return '';
  else if (chainId === 8453)
    // Base
    return '';
  else throw new Error('Unexpected network!');
}

async function getMultiSigAddress() {
  const chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
  if (chainId === 1287 || chainId === 31337)
    // Moonbase Alpha or Hardhat
    return '0xCD7A0D098E3A750126b0fec54BE401476812cfc0';
  else if (chainId === 1285)
    // Moonriver
    return '0x7E8421B873429EE58A06055E89CD0DBEF51784F0';
  else if (chainId === 1284)
    // Moonbeam
    return '0x85Ab410A50A3D85f1a26d9e4eFCaa520a39B9CD6';
  else if (chainId === 1)
    // Ethereum
    return '0xCa03d97879031aB5EDF81921Ef5AD3383B3Cc760';
  else if (chainId === 137)
    // Polygon
    return '0x0fF3ecf4E7C5534D4d236276D7D9F394293E6375';
  else if (chainId === 592)
    // Astar
    return '0x6Beef2f0ecA275D47B70f0c900fF68f97C1e3d24';
  else if (chainId === 8453)
    // Base
    return '0xA01984b6e00586CA61269eb966E588466c112F5b';
  else if (chainId === 56)
    // BSC
    return '0x25864456507954bE6020eA12d0Bde3617901935b';
  else throw new Error('Unexpected network!');
}

async function getSwapperAddress() {
  const chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
  if (chainId === 1284)
    // Moonbeam
    return '0xeC15f6C93F6E41847C03a3c748e524465add8b7a';
  if (chainId === 1)
    // Ethereum
    return '0x767908960690d58F494C94B69521362826AC2cBB';
  else if (chainId === 137)
    // Polygon
    return '0x89AC95db035dBe04Ff2e591C19Cce645b65867BE';
  else throw new Error('Unexpected network!');
}

const NEW_RMRK_ADDRESS = '0x524d524B4c9366be706D3A90dcf70076ca037aE3';
const MOONRIVER_MIGRATOR_ADDRESS = '0x923C768AC53B24a188333f3709b71cB343DB20b2'; // Also update on storeMigrationsForBatch and getTxToStartMoonriverMigration tasks
const MOONBEAM_MIGRATOR_ADDRESS = '0xf4B6FE71B6aa6f904864B4C95ECDBcc06CBec5d9';
const ITS_ADDRESS = '0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C';

export {
  getLegacyRMRKAddress,
  getMultiSigAddress,
  getSwapperAddress,
  NEW_RMRK_ADDRESS,
  MOONRIVER_MIGRATOR_ADDRESS,
  MOONBEAM_MIGRATOR_ADDRESS,
  ITS_ADDRESS,
};
