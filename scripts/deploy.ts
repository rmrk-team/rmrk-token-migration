import { ethers, network } from 'hardhat';
import {
  DeployProxy,
  LegacyRMRK,
  Migrator,
  MoonriverMigrator,
  RMRK,
  Swapper,
  SwapperMinter,
} from '../typechain-types';
import { BigNumber, Wallet } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { getContractAddress } from 'ethers/lib/utils';
import { bytecode } from '../artifacts/contracts/RMRK.sol/RMRK.json';

async function deployNewRmrkAndMigrator(
  legacyRMRK: string,
): Promise<{ rmrk: RMRK; migrator: Migrator }> {
  const rmrk = await deployNewRMRK();

  const MigratorFactory = await ethers.getContractFactory('Migrator');
  const migrator = await MigratorFactory.deploy(legacyRMRK, rmrk.address, PAUSE_DELAY);
  await migrator.deployed();

  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), migrator.address);

  return { rmrk, migrator };
}

async function deployMoonriverMigrator(legacyRMRK: string): Promise<MoonriverMigrator> {
  const MoonriverMigratorFactory = await ethers.getContractFactory('MoonriverMigrator');
  const moonriverMigrator = await MoonriverMigratorFactory.deploy(legacyRMRK);
  await moonriverMigrator.deployed();

  return moonriverMigrator;
}

async function deployNewRMRK(): Promise<RMRK> {
  const [deployer] = await ethers.getSigners();
  const deployProxy = await deployDeployProxy();

  const saltHex = ethers.utils.id('231255408'); // From calculate salt

  const rmrkDeploy = await deployProxy.connect(deployer).deployContract(bytecode, saltHex);
  const transactionReceipt = await rmrkDeploy.wait();

  const newContracttopicId = ethers.utils.id('NewContract(address)');
  const event = transactionReceipt.logs.find((log) => log.topics[0] === newContracttopicId);
  if (!event) {
    throw new Error('NewContract event not found');
  }
  const parsed = deployProxy.interface.parseLog(event);
  const rmrkAddress = parsed.args[0];

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = RMRKFactory.attach(rmrkAddress);

  return rmrk;
}

async function deployLegacyRMRK(): Promise<LegacyRMRK> {
  const legacyRMRKFactory = await ethers.getContractFactory('LegacyRMRK');
  const legacyRMRK = await legacyRMRKFactory.deploy();
  await legacyRMRK.deployed();

  return legacyRMRK;
}

async function deploySwapper(legacyRMRK: string, newRMRK: string): Promise<Swapper> {
  const swapperFactory = await ethers.getContractFactory('Swapper');
  const swapper = await swapperFactory.deploy(legacyRMRK, newRMRK);
  await swapper.deployed();

  return swapper;
}

async function deploySwapperMinter(legacyRMRK: string, newRMRK: string): Promise<SwapperMinter> {
  const swapperMinterFactory = await ethers.getContractFactory('SwapperMinter');
  const swapperMinter = await swapperMinterFactory.deploy(legacyRMRK, newRMRK, PAUSE_DELAY);
  await swapperMinter.deployed();

  return swapperMinter;
}

async function deployDeployProxy(): Promise<DeployProxy> {
  // The gas estimation for deploying the contract is 143077, taken from gas report on tests.
  const DEPLOY_PROXY_GAS_NEEDED = BigNumber.from(150000);

  const funder = (await ethers.getSigners())[0];
  const proxyDeployer = new Wallet(process.env.PROXY_DEPLOYER || '', ethers.provider);
  console.log(`Funder Address: ${funder.address}`);
  console.log(`Deployer Address: ${proxyDeployer.address}`);

  if (network.name === 'hardhat') {
    await funder.sendTransaction({
      to: proxyDeployer.address,
      value: ethers.utils.parseEther('1.0'),
    });
  }

  const deployerProxyAddress = getContractAddress({
    from: proxyDeployer.address,
    nonce: 0,
  });

  const gasPrice =
    network.config.gasPrice === 'auto'
      ? await ethers.provider.getGasPrice()
      : network.config.gasPrice;

  const deployProxyFactory = await ethers.getContractFactory('DeployProxy');
  let deployProxy: DeployProxy;
  const code = await ethers.provider.getCode(deployerProxyAddress);
  if (code !== '0x') {
    // DeployerProxy is already deployed
    deployProxy = deployProxyFactory.attach(deployerProxyAddress);
    console.log(`DeployProxy already deployed to: ${deployProxy.address}`);
  } else {
    const transactionCount = await proxyDeployer.getTransactionCount();
    if (transactionCount > 0) {
      throw new Error(
        'Deployer already deployed a contract and it was not the deployer proxy. Due to nonce, the deployer proxy cannot be deployed to the expected address.',
      );
    }
    const funded = await sendGasFromFunder(proxyDeployer, funder, DEPLOY_PROXY_GAS_NEEDED); // 143077 is the gas estimation for deploying the contract, taken from gas report on tests
    if (!funded) {
      throw new Error('Funding failed');
    }
    deployProxy = await deployProxyFactory.connect(proxyDeployer).deploy({
      gasLimit: DEPLOY_PROXY_GAS_NEEDED,
      gasPrice: gasPrice,
    }); // Used for the networks where the deploy proxy is not deployed to
    await deployProxy.deployed();
  }

  return deployProxy;
}

async function sendGasFromFunder(
  deployer: Wallet,
  funder: SignerWithAddress,
  gasEstimation: BigNumber,
): Promise<boolean> {
  const gasPrice =
    network.config.gasPrice === 'auto'
      ? await ethers.provider.getGasPrice()
      : network.config.gasPrice;
  const totalGasPrice = gasEstimation.mul(gasPrice).mul(105).div(100);
  const deployerBalance = await deployer.getBalance();
  const funderBalance = await funder.getBalance();

  if (deployerBalance.lt(totalGasPrice)) {
    const missingGas = totalGasPrice.sub(deployerBalance);
    if (funderBalance.lt(missingGas)) {
      console.log('Funder does not have enough gas to complete gas needed on deployer');
      return false;
    }
    console.log('Sending gas from funder to deployer...');
    let tx = await funder.sendTransaction({
      to: deployer.address,
      value: missingGas,
    });
    await tx.wait();
  }
  return true;
}

const ADMINS = [
  '0xfbea1b97406C6945D07F50F588e54144ea8B684f', //YP
  '0x0f45B42c42184cA3BdF3c261aD386B7f18Ef49aA', //YG
  '0x98Df228716b90d21868A10309453c774719e2C2e', //IO
  '0xA6cc9397d29b631b69782e5F7fB9801224C8FA90', //SP
];

const PAUSE_DELAY = 3600 * 24 * 7; // A week

export {
  deployDeployProxy,
  deployNewRmrkAndMigrator,
  deployMoonriverMigrator,
  deployNewRMRK,
  deployLegacyRMRK,
  deploySwapper,
  deploySwapperMinter,
  ADMINS,
  PAUSE_DELAY,
};
