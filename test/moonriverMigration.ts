import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { MoonriverMigrator, LegacyRMRK } from '../typechain-types';
import { deployLegacyRMRK, deployMoonriverMigrator } from '../scripts/deploy';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

enum State {
  NotStarted,
  Started,
  Migrating,
  Finished,
}

async function fixture(): Promise<{
  legacyRMRK: LegacyRMRK;
  migrator: MoonriverMigrator;
  deployer: SignerWithAddress;
  holders: SignerWithAddress[];
}> {
  const [deployer, ...holders] = await ethers.getSigners();
  const legacyRMRK = await deployLegacyRMRK();
  const migrator = await deployMoonriverMigrator(legacyRMRK.address);

  return { legacyRMRK, migrator, deployer, holders };
}

describe('Moonriver Migrator', async () => {
  let legacyRMRK: LegacyRMRK;
  let migrator: MoonriverMigrator;
  let deployer: SignerWithAddress;
  let holders: SignerWithAddress[];

  beforeEach(async function () {
    ({ legacyRMRK, migrator, deployer, holders } = await loadFixture(fixture));

    await legacyRMRK.mint(holders[0].address, ethers.utils.parseUnits('100', 10));
    await legacyRMRK.mint(holders[1].address, ethers.utils.parseUnits('50', 10));
    await legacyRMRK.mint(holders[2].address, ethers.utils.parseUnits('15', 10));
  });

  it('can do full migrate process', async () => {
    const currentBatch = 1;
    expect(await migrator.batchState(currentBatch)).to.equal(State.NotStarted);
    await migrator.startNextBatch();
    expect(await migrator.batchState(currentBatch)).to.equal(State.Started);
    expect(await migrator.currentBatch()).to.equal(currentBatch);

    await legacyRMRK
      .connect(holders[0])
      .approve(migrator.address, ethers.utils.parseUnits('100', 10));
    await legacyRMRK
      .connect(holders[1])
      .approve(migrator.address, ethers.utils.parseUnits('40', 10));
    await legacyRMRK
      .connect(holders[2])
      .approve(migrator.address, ethers.utils.parseUnits('15', 10));

    await migrator.connect(holders[0]).migrate(ethers.utils.parseUnits('80', 10));
    await migrator.connect(holders[1]).migrate(ethers.utils.parseUnits('40', 10));
    await migrator.connect(holders[2]).migrate(ethers.utils.parseUnits('15', 10));
    await migrator.connect(holders[0]).migrate(ethers.utils.parseUnits('20', 10));

    expect(await migrator.balancePerHolderAndBatch(currentBatch, holders[0].address)).to.equal(
      ethers.utils.parseUnits('100', 10),
    );
    expect(await migrator.balancePerHolderAndBatch(currentBatch, holders[1].address)).to.equal(
      ethers.utils.parseUnits('40', 10),
    );
    expect(await migrator.balancePerHolderAndBatch(currentBatch, holders[2].address)).to.equal(
      ethers.utils.parseUnits('15', 10),
    );

    expect(await migrator.balancePerBatch(currentBatch)).to.equal(
      ethers.utils.parseUnits('155', 10),
    );

    await migrator.startMigratingBatch(1);
    expect(await migrator.batchState(currentBatch)).to.equal(State.Migrating);

    expect(await migrator.getHoldersPerBatch(currentBatch)).to.eql([
      holders[0].address,
      holders[1].address,
      holders[2].address,
    ]);
    expect(await migrator.getMigrationsForBatch(currentBatch)).to.eql([
      [holders[0].address, holders[1].address, holders[2].address],
      [
        ethers.utils.parseUnits('100', 10),
        ethers.utils.parseUnits('40', 10),
        ethers.utils.parseUnits('15', 10),
      ],
    ]);

    await migrator.finishBatch(currentBatch);
    expect(await migrator.batchState(currentBatch)).to.equal(State.Finished);
  });

  it('starts a new batch if max holders per batch is reached', async () => {
    const currentBatch = 1;
    const nextBatch = 2;
    await migrator.startNextBatch();
    await migrator.connect(deployer).setMaxHoldersPerBatch(2);

    await legacyRMRK
      .connect(holders[0])
      .approve(migrator.address, ethers.utils.parseUnits('100', 10));
    await legacyRMRK
      .connect(holders[1])
      .approve(migrator.address, ethers.utils.parseUnits('50', 10));
    await legacyRMRK
      .connect(holders[2])
      .approve(migrator.address, ethers.utils.parseUnits('15', 10));

    await migrator.connect(holders[0]).migrate(ethers.utils.parseUnits('80', 10));
    await migrator.connect(holders[1]).migrate(ethers.utils.parseUnits('40', 10));
    // Not started yet, since current holders in batch could add more
    expect(await migrator.currentBatch()).to.equal(currentBatch);
    await migrator.connect(holders[1]).migrate(ethers.utils.parseUnits('10', 10));
    expect(await migrator.currentBatch()).to.equal(currentBatch);

    // This will trigger new batch to start since it's the 3rd holder
    await migrator.connect(holders[2]).migrate(ethers.utils.parseUnits('15', 10));
    expect(await migrator.currentBatch()).to.equal(nextBatch);
  });

  it('cannot migrate if paused', async () => {
    await migrator.connect(deployer).pause();
    await expect(
      migrator.connect(holders[0]).migrate(ethers.utils.parseUnits('100', 10)),
    ).to.be.revertedWithCustomError(migrator, 'EnforcedPause');
  });

  it('cannot migrate current batch not started', async () => {
    await expect(
      migrator.connect(holders[0]).migrate(ethers.utils.parseUnits('100', 10)),
    ).to.be.revertedWithCustomError(migrator, 'BatchNotStarted');
  });

  it('cannot start migrating on non started batch', async () => {
    await expect(migrator.connect(deployer).startMigratingBatch(1)).to.be.revertedWithCustomError(
      migrator,
      'BatchNotStarted',
    );
  });

  it('cannot finish migration on non migrating batch', async () => {
    await expect(migrator.connect(deployer).finishBatch(1)).to.be.revertedWithCustomError(
      migrator,
      'BatchNotMigrating',
    );
    await migrator.connect(deployer).startNextBatch();
    await expect(migrator.connect(deployer).finishBatch(1)).to.be.revertedWithCustomError(
      migrator,
      'BatchNotMigrating',
    );
  });

  it('can pause/unpause if owner', async function () {
    await migrator.connect(deployer).pause();
    expect(await migrator.paused()).to.equal(true);
    await migrator.connect(deployer).unpause();
    expect(await migrator.paused()).to.equal(false);
  });

  it('can set max holders per batch if owner', async function () {
    await migrator.connect(deployer).setMaxHoldersPerBatch(5);
    expect(await migrator.maxHoldersPerBatch()).to.eql(BigNumber.from(5));
  });

  it('cannot pause/unpause if not owner', async function () {
    await expect(migrator.connect(holders[0]).pause()).to.be.revertedWithCustomError(
      migrator,
      'OwnableUnauthorizedAccount',
    );
    await expect(migrator.connect(holders[0]).unpause()).to.be.revertedWithCustomError(
      migrator,
      'OwnableUnauthorizedAccount',
    );
  });

  it('cannot set max holders per batch if not owner', async function () {
    await expect(
      migrator.connect(holders[0]).setMaxHoldersPerBatch(5),
    ).to.be.revertedWithCustomError(migrator, 'OwnableUnauthorizedAccount');
  });

  it('cannot change batch states if not owner', async function () {
    await expect(migrator.connect(holders[0]).startNextBatch()).to.be.revertedWithCustomError(
      migrator,
      'OwnableUnauthorizedAccount',
    );
    await expect(migrator.connect(holders[0]).startMigratingBatch(1)).to.be.revertedWithCustomError(
      migrator,
      'OwnableUnauthorizedAccount',
    );
    await expect(migrator.connect(holders[0]).finishBatch(1)).to.be.revertedWithCustomError(
      migrator,
      'OwnableUnauthorizedAccount',
    );
  });
});
