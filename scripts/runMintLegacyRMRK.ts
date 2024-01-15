import { ethers } from 'hardhat';

const addresses = [
  '0x05c309b0a30264df86398ceA6D42bAdbaf2138B6',
  '0x73d5Bf6D46bc26AC59474B1cBc75A140366F31De',
  '0x0C21f238406c9D003CD44C07c879B1866820Ee60',
  '0x251dE9CedBB6A939cFA94152e5A38118cc6f6a1c',
  '0x3E3d1657340e3aaf165501C60E347bc72dbDc0c2',
  '0xe330Dc28b47d73884AD88837aECfEE1F49Ad7e7b',
  '0x3be41bE04d559CEBf93AF8d657c5484fa1521861',
  '0x664660954f10088Ae7Ac2534e76369939CFb3013',
  '0x0F6f2E6b72291FcFd65e6ad8B356B41137b11E69',
  '0xF22E23DEfA3cA75103b5264541ee2028463ADF02',
];

async function main() {
  console.log('Deploying Legacy RMRK');
  const legacyRMRKFactory = await ethers.getContractFactory('LegacyRMRK');

  const legacyRMRKAddress = '0x0cF0bc4dD026F3b7FEc0339812D99D11829c0DF4'; // Moonriver & Moonbeam & Astar
  // const legacyRMRKAddress = '0x252Ef85E1e66d34A8F3DF2bC8d52518174A49585'; // Polygon
  const legacyRMRK = legacyRMRKFactory.attach(legacyRMRKAddress); // 0x0cF0bc4dD026F3b7FEc0339812D99D11829c0DF4

  for (const address of addresses) {
    let tx = await legacyRMRK.mint(address, ethers.utils.parseUnits('1000', 10));
    await tx.wait();
  }

  console.log(`Legacy RMRK minted`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
