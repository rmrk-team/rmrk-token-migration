import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { MoonriverMigrator, RMRK, LegacyRMRK, Swapper, SwapperMinter } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

enum State {
  NotStarted,
  Started,
  Migrating,
  Finished,
}

async function fixture(): Promise<{
  legacyRMRK: LegacyRMRK;
  rmrk: RMRK;
  swapper: Swapper;
  swapperMinter: SwapperMinter;
  deployer: SignerWithAddress;
  allowedMinter: SignerWithAddress;
  signers: SignerWithAddress[];
}> {
  const [deployer, allowedMinter, ...signers] = await ethers.getSigners();
  const legacyRMRKFactory = await ethers.getContractFactory('LegacyRMRK');
  const legacyRMRK = await legacyRMRKFactory.deploy();

  const RMRKFactory = await ethers.getContractFactory('RMRK');
  const rmrk = await RMRKFactory.deploy();
  await rmrk.deployed();

  const swapperFactory = await ethers.getContractFactory('Swapper');
  const swapper = await swapperFactory.deploy(legacyRMRK.address, rmrk.address);
  await swapper.deployed();

  const swapperMinterFactory = await ethers.getContractFactory('SwapperMinter');
  const swapperMinter = await swapperMinterFactory.deploy(legacyRMRK.address, rmrk.address, 3600);
  await swapperMinter.deployed();

  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), allowedMinter.address);
  await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), swapperMinter.address);

  return { legacyRMRK, rmrk, swapper, swapperMinter, deployer, allowedMinter, signers };
}

describe('Swapper', async () => {
  let legacyRMRK: LegacyRMRK;
  let rmrk: RMRK;
  let swapper: Swapper;
  let deployer: SignerWithAddress;
  let allowedMinter: SignerWithAddress;
  let holders: SignerWithAddress[];

  beforeEach(async function () {
    ({
      legacyRMRK,
      rmrk,
      swapper,
      deployer,
      allowedMinter,
      signers: holders,
    } = await loadFixture(fixture));

    await legacyRMRK.mint(holders[0].address, ethers.utils.parseUnits('100', 10));
    await legacyRMRK.mint(holders[1].address, ethers.utils.parseUnits('50', 10));
  });

  it('can swap tokens if there is new RMRK balance', async () => {
    const initRMRKBalanceOnSwapper = ethers.utils.parseUnits('200', 18);
    rmrk.connect(allowedMinter).mint(swapper.address, initRMRKBalanceOnSwapper);
    await legacyRMRK
      .connect(holders[0])
      .approve(swapper.address, ethers.utils.parseUnits('100', 10));
    await legacyRMRK
      .connect(holders[1])
      .approve(swapper.address, ethers.utils.parseUnits('40', 10));

    await swapper
      .connect(holders[0])
      .swapLegacyRMRK(ethers.utils.parseUnits('80', 10), holders[0].address);
    await swapper
      .connect(holders[1])
      .swapLegacyRMRK(ethers.utils.parseUnits('40', 10), holders[2].address); // Transferred to another address

    expect(await rmrk.balanceOf(holders[0].address)).to.equal(ethers.utils.parseUnits('80', 18));
    expect(await rmrk.balanceOf(holders[2].address)).to.equal(ethers.utils.parseUnits('40', 18));

    expect(await legacyRMRK.balanceOf(holders[0].address)).to.equal(
      ethers.utils.parseUnits('20', 10),
    );
    expect(await legacyRMRK.balanceOf(holders[1].address)).to.equal(
      ethers.utils.parseUnits('10', 10),
    );

    expect(await legacyRMRK.balanceOf(swapper.address)).to.equal(
      ethers.utils.parseUnits('120', 10),
    );
    expect(await rmrk.balanceOf(swapper.address)).to.equal(
      initRMRKBalanceOnSwapper.sub(ethers.utils.parseUnits('120', 18)),
    );
  });

  it('cannot swap tokens if there is not enough RMRK balance', async () => {
    const initRMRKBalanceOnSwapper = ethers.utils.parseUnits('50', 18);
    rmrk.connect(allowedMinter).mint(swapper.address, initRMRKBalanceOnSwapper);
    await legacyRMRK
      .connect(holders[0])
      .approve(swapper.address, ethers.utils.parseUnits('100', 10));
    await expect(
      swapper
        .connect(holders[0])
        .swapLegacyRMRK(ethers.utils.parseUnits('80', 10), holders[0].address),
    ).to.be.revertedWithCustomError(swapper, 'NotEnoughBalance');
  });

  it('cannot swap if paused', async () => {
    await swapper.connect(deployer).pause();
    await expect(
      swapper
        .connect(holders[0])
        .swapLegacyRMRK(ethers.utils.parseUnits('100', 10), holders[0].address),
    ).to.be.revertedWith('Pausable: paused');
  });

  it('can pause/unpause if owner', async function () {
    await swapper.connect(deployer).pause();
    expect(await swapper.paused()).to.equal(true);
    await swapper.connect(deployer).unpause();
    expect(await swapper.paused()).to.equal(false);
  });

  describe('With swapped tokens', async function () {
    beforeEach(async function () {
      const initRMRKBalanceOnSwapper = ethers.utils.parseUnits('50', 18);
      rmrk.connect(allowedMinter).mint(swapper.address, initRMRKBalanceOnSwapper);
      await legacyRMRK
        .connect(holders[0])
        .approve(swapper.address, ethers.utils.parseUnits('50', 10));
      await swapper
        .connect(holders[0])
        .swapLegacyRMRK(ethers.utils.parseUnits('50', 10), holders[0].address);
    });

    it('can burn legacy rmrk if owner', async function () {
      await swapper.burnLegacyRMRK(ethers.utils.parseUnits('50', 10));
      expect(await legacyRMRK.balanceOf(swapper.address)).to.equal(
        ethers.utils.parseUnits('0', 10),
      );
    });

    it('cannot burn legacy rmrk if not owner', async function () {
      await expect(
        swapper.connect(holders[0]).burnLegacyRMRK(ethers.utils.parseUnits('50', 10)),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  it('cannot pause/unpause if not owner', async function () {
    await expect(swapper.connect(holders[0]).pause()).to.be.revertedWith(
      'Ownable: caller is not the owner',
    );
    await expect(swapper.connect(holders[0]).unpause()).to.be.revertedWith(
      'Ownable: caller is not the owner',
    );
  });
});

describe('SwapperMinter', async () => {
  let legacyRMRK: LegacyRMRK;
  let rmrk: RMRK;
  let swapperMinter: SwapperMinter;
  let deployer: SignerWithAddress;
  let holders: SignerWithAddress[];

  beforeEach(async function () {
    ({ legacyRMRK, rmrk, swapperMinter, deployer, signers: holders } = await loadFixture(fixture));

    await legacyRMRK.mint(holders[0].address, ethers.utils.parseUnits('100', 10));
    await legacyRMRK.mint(holders[1].address, ethers.utils.parseUnits('50', 10));
  });

  it('can swap tokens if there is new RMRK balance', async () => {
    await legacyRMRK
      .connect(holders[0])
      .approve(swapperMinter.address, ethers.utils.parseUnits('100', 10));
    await legacyRMRK
      .connect(holders[1])
      .approve(swapperMinter.address, ethers.utils.parseUnits('40', 10));

    await swapperMinter
      .connect(holders[0])
      .swapLegacyRMRK(ethers.utils.parseUnits('80', 10), holders[0].address);
    await swapperMinter
      .connect(holders[1])
      .swapLegacyRMRK(ethers.utils.parseUnits('40', 10), holders[2].address); // Transferred to another address

    expect(await rmrk.balanceOf(holders[0].address)).to.equal(ethers.utils.parseUnits('80', 18));
    expect(await rmrk.balanceOf(holders[2].address)).to.equal(ethers.utils.parseUnits('40', 18));

    expect(await legacyRMRK.balanceOf(holders[0].address)).to.equal(
      ethers.utils.parseUnits('20', 10),
    );
    expect(await legacyRMRK.balanceOf(holders[1].address)).to.equal(
      ethers.utils.parseUnits('10', 10),
    );

    expect(await legacyRMRK.balanceOf(swapperMinter.address)).to.equal(
      ethers.utils.parseUnits('0', 10),
    );
  });

  it('cannot swap if paused', async () => {
    await swapperMinter.connect(deployer).pause();
    await expect(
      swapperMinter
        .connect(holders[0])
        .swapLegacyRMRK(ethers.utils.parseUnits('100', 10), holders[0].address),
    ).to.be.revertedWith('Pausable: paused');
  });

  it('can pause/unpause if owner', async function () {
    await swapperMinter.connect(deployer).pause();
    expect(await swapperMinter.paused()).to.equal(true);
    await swapperMinter.connect(deployer).unpause();
    expect(await swapperMinter.paused()).to.equal(false);
  });

  it('cannot pause/unpause if not owner', async function () {
    await expect(swapperMinter.connect(holders[0]).pause()).to.be.revertedWithCustomError(
      swapperMinter,
      'Unauthorized',
    );
    await expect(swapperMinter.connect(holders[0]).unpause()).to.be.revertedWith(
      'Ownable: caller is not the owner',
    );
  });
});
