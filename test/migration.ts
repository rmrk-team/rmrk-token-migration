import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { Migrator, RMRK, LegacyRMRK } from '../typechain-types';
import { deployContracts } from '../scripts/deploy';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

async function fixture(): Promise<{
  legacyRMRK: LegacyRMRK;
  rmrk: RMRK;
  migrator: Migrator;
  deployer: SignerWithAddress;
  allowedMinter: SignerWithAddress;
  signers: SignerWithAddress[];
}> {
  const [deployer, allowedMinter, ...signers] = await ethers.getSigners();
  const legacyRMRKFactory = await ethers.getContractFactory('LegacyRMRK');
  const legacyRMRK = await legacyRMRKFactory.deploy();

  const { rmrk, migrator } = await deployContracts(legacyRMRK.address);

  return { legacyRMRK, rmrk, migrator, deployer, allowedMinter, signers };
}

describe('RMRK Token', async () => {
  let legacyRMRK: LegacyRMRK;
  let rmrk: RMRK;
  let migrator: Migrator;
  let deployer: SignerWithAddress;
  let allowedMinter: SignerWithAddress;
  let signers: SignerWithAddress[];

  beforeEach(async function () {
    ({ legacyRMRK, rmrk, migrator, deployer, allowedMinter, signers } = await loadFixture(fixture));
    const minterRole = await rmrk.MINTER_ROLE();
    await rmrk.grantRole(minterRole, allowedMinter.address);
    await rmrk.grantRole(minterRole, migrator.address);
  });

  it('cannot mint without minter role', async function () {
    await expect(
      rmrk.connect(signers[0]).mint(signers[0].address, ethers.utils.parseEther('100')),
    ).to.be.revertedWith(
      `AccessControl: account ${signers[0].address.toLowerCase()} is missing role ${await rmrk.MINTER_ROLE()}`,
    );
    // Deployer does not get minter role by default
    await expect(
      rmrk.connect(deployer).mint(deployer.address, ethers.utils.parseEther('100')),
    ).to.be.revertedWith(
      `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${await rmrk.MINTER_ROLE()}`,
    );
  });

  it('can mint with minter role', async function () {
    await rmrk.connect(allowedMinter).mint(signers[0].address, ethers.utils.parseEther('100'));
    expect(await rmrk.balanceOf(signers[0].address)).to.equal(ethers.utils.parseEther('100'));
  });

  it('cannot mint over max supply', async function () {
    await expect(
      rmrk.connect(allowedMinter).mint(signers[0].address, ethers.utils.parseEther('10000001')),
    ).to.be.revertedWithCustomError(rmrk, 'MaxSupplyExceeded');
  });

  describe('With minted tokens', async () => {
    let holder1: SignerWithAddress;
    let holder2: SignerWithAddress;
    beforeEach(async function () {
      [holder1, holder2] = signers;
      await rmrk.connect(allowedMinter).mint(holder1.address, ethers.utils.parseEther('100'));
    });

    it('can transfer tokens', async function () {
      await rmrk.connect(holder1).transfer(holder2.address, ethers.utils.parseEther('40'));
      expect(await rmrk.balanceOf(holder1.address)).to.equal(ethers.utils.parseEther('60'));
      expect(await rmrk.balanceOf(holder2.address)).to.equal(ethers.utils.parseEther('40'));
    });

    it('can burn tokens', async function () {
      await rmrk.connect(holder1).burn(ethers.utils.parseEther('40'));
      expect(await rmrk.balanceOf(holder1.address)).to.equal(ethers.utils.parseEther('60'));
    });
  });

  describe('Migrator', async () => {
    let holder1: SignerWithAddress;
    let holder2: SignerWithAddress;
    let initLegacyBalance: BigNumber;

    beforeEach(async function () {
      [holder1, holder2] = signers;
      initLegacyBalance = ethers.utils.parseUnits('100', 10);
      await legacyRMRK.mint(holder1.address, initLegacyBalance);
    });

    it('legacy RMRK has 10 decimals and new RMRK has 18', async function () {
      expect(await legacyRMRK.decimals()).to.equal(10);
      expect(await rmrk.decimals()).to.equal(18);
    });

    it('can swap tokens partially and they are burned', async function () {
      const swapAmount = ethers.utils.parseUnits('40', 10);
      const totalSupply = await legacyRMRK.totalSupply();
      await legacyRMRK.connect(holder1).approve(migrator.address, swapAmount);
      await migrator.connect(holder1).swapLegacyRMRK(swapAmount, holder1.address);

      expect(await legacyRMRK.balanceOf(holder1.address)).to.equal(
        initLegacyBalance.sub(swapAmount),
      );
      expect(await rmrk.balanceOf(holder1.address)).to.equal(swapAmount.mul(10 ** 8));
      expect(await legacyRMRK.totalSupply()).to.equal(totalSupply.sub(swapAmount));
    });

    it('can swap tokens fully and they are burned', async function () {
      const swapAmount = initLegacyBalance;
      const totalSupply = await legacyRMRK.totalSupply();
      await legacyRMRK.connect(holder1).approve(migrator.address, swapAmount);
      await migrator.connect(holder1).swapLegacyRMRK(swapAmount, holder1.address);

      expect(await legacyRMRK.balanceOf(holder1.address)).to.equal(
        initLegacyBalance.sub(swapAmount),
      );
      expect(await rmrk.balanceOf(holder1.address)).to.equal(swapAmount.mul(10 ** 8));
      expect(await legacyRMRK.totalSupply()).to.equal(totalSupply.sub(swapAmount));
    });

    it('can swap tokens to other address and they are burned', async function () {
      const swapAmount = ethers.utils.parseUnits('40', 10);
      const totalSupply = await legacyRMRK.totalSupply();
      await legacyRMRK.connect(holder1).approve(migrator.address, swapAmount);
      await migrator.connect(holder1).swapLegacyRMRK(swapAmount, holder2.address);

      expect(await legacyRMRK.balanceOf(holder1.address)).to.equal(
        initLegacyBalance.sub(swapAmount),
      );
      expect(await rmrk.balanceOf(holder2.address)).to.equal(swapAmount.mul(10 ** 8));
      expect(await legacyRMRK.totalSupply()).to.equal(totalSupply.sub(swapAmount));
    });

    it('can migrate tokens', async function () {
      // We assume that the token was already locked on the other network
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);

      await migrator.connect(deployer).migrate([holder1.address, holder2.address], [amountHolder1, amountHolder2]);
      expect(await rmrk.balanceOf(holder1.address)).to.equal(amountHolder1.mul(10 ** 8));
      expect(await rmrk.balanceOf(holder2.address)).to.equal(amountHolder2.mul(10 ** 8));
    });

    it('cannot swap legacy tokens when paused', async function () {
      await migrator.connect(deployer).pause();
      const swapAmount = ethers.utils.parseUnits('40', 10);
      await legacyRMRK.connect(holder1).approve(migrator.address, swapAmount);
      await expect(
        migrator.connect(holder1).swapLegacyRMRK(swapAmount, holder1.address),
      ).to.be.revertedWith('Pausable: paused');
    });

    it('cannot migrate tokens when paused', async function () {
      await migrator.connect(deployer).pause();
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await expect(
        migrator.connect(deployer).migrate([holder1.address, holder2.address], [amountHolder1, amountHolder2]),
      ).to.be.revertedWith('Pausable: paused');
    });

    it('cannot migrate tokens if lenght of amounts and tos do not match', async function () {
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await expect(
        migrator.connect(deployer).migrate([holder1.address], [amountHolder1, amountHolder2]),
      ).to.be.revertedWithCustomError(migrator, 'ArrayLenghtsDoNotMatch');
      await expect(
        migrator.connect(deployer).migrate([holder1.address, holder2.address], [amountHolder1]),
      ).to.be.revertedWithCustomError(migrator, 'ArrayLenghtsDoNotMatch');
    });

    it('cannot migrate tokens if not owner', async function () {
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await expect(
        migrator.connect(holder1).migrate([holder1.address, holder2.address], [amountHolder1, amountHolder2]),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('cannot pause if not owner', async function () {
      await expect(migrator.connect(holder1).pause()).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });
});
