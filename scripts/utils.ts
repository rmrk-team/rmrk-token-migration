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
  else if (chainId === 8453)
    // Base
    return '';
  else throw new Error('Unexpected network!');
}

export { getLegacyRMRKAddress };
