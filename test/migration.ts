import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { Migrator, RMRK, LegacyRMRK } from '../typechain-types';
import { deployLegacyRMRK, deployNewRmrkAndMigrator } from '../scripts/deploy';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

async function fixture(): Promise<{
  legacyRMRK: LegacyRMRK;
  rmrk: RMRK;
  migrator: Migrator;
  deployer: SignerWithAddress;
  allowedMinter: SignerWithAddress;
  allowedBurner: SignerWithAddress;
  signers: SignerWithAddress[];
}> {
  const [deployer, allowedMinter, allowedBurner, ...signers] = await ethers.getSigners();
  const legacyRMRK = await deployLegacyRMRK();
  const { rmrk, migrator } = await deployNewRmrkAndMigrator(legacyRMRK.address);

  return { legacyRMRK, rmrk, migrator, deployer, allowedMinter, allowedBurner, signers };
}

describe('RMRK Token', async () => {
  let legacyRMRK: LegacyRMRK;
  let rmrk: RMRK;
  let migrator: Migrator;
  let deployer: SignerWithAddress;
  let allowedMinter: SignerWithAddress;
  let allowedBurner: SignerWithAddress;
  let signers: SignerWithAddress[];

  beforeEach(async function () {
    ({ legacyRMRK, rmrk, migrator, deployer, allowedMinter, allowedBurner, signers } =
      await loadFixture(fixture));
    await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), allowedMinter.address);
    await rmrk.grantRole(ethers.utils.id('BURNER_ROLE'), allowedBurner.address);
  });

  it('cannot mint without minter role', async function () {
    await expect(
      rmrk.connect(signers[0]).mint(signers[0].address, ethers.utils.parseEther('100')),
    ).to.be.revertedWithCustomError(rmrk, 'AccessControlUnauthorizedAccount');
    // Deployer does not get minter role by default
    await expect(
      rmrk.connect(deployer).mint(deployer.address, ethers.utils.parseEther('100')),
    ).to.be.revertedWithCustomError(rmrk, 'AccessControlUnauthorizedAccount');
  });

  it('cannot burn from other address without burner role', async function () {
    const account = signers[0].address;
    await rmrk.connect(allowedMinter).mint(account, ethers.utils.parseEther('100'));
    await expect(
      rmrk.connect(signers[0])['burn(address,uint256)'](account, ethers.utils.parseEther('100')),
    ).to.be.revertedWithCustomError(rmrk, 'AccessControlUnauthorizedAccount');
    // Deployer does not get minter role by default
    await expect(
      rmrk
        .connect(deployer)
        ['burn(address,uint256)'](deployer.address, ethers.utils.parseEther('100')),
    ).to.be.revertedWithCustomError(rmrk, 'AccessControlUnauthorizedAccount');
  });

  it('can mint with minter role', async function () {
    await rmrk.connect(allowedMinter).mint(signers[0].address, ethers.utils.parseEther('100'));
    expect(await rmrk.balanceOf(signers[0].address)).to.equal(ethers.utils.parseEther('100'));
  });

  it('can burn with burner role', async function () {
    const account = signers[0].address;
    await rmrk.connect(allowedMinter).mint(account, ethers.utils.parseEther('100'));
    await rmrk
      .connect(allowedBurner)
      ['burn(address,uint256)'](account, ethers.utils.parseEther('100'));
    expect(await rmrk.balanceOf(account)).to.equal(ethers.utils.parseEther('0'));
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
      await rmrk.connect(holder1)['burn(uint256)'](ethers.utils.parseEther('40'));
      expect(await rmrk.balanceOf(holder1.address)).to.equal(ethers.utils.parseEther('60'));
    });

    it('can use permit to give allowance without spending gas', async function () {
      const allowance = ethers.utils.parseEther('10');
      // Get current block number
      const lastBlock = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(lastBlock);
      const deadline = block.timestamp + 3600;

      // get the current nonce for the deployer address
      const nonces = await rmrk.nonces(holder1.address);

      // set the domain parameters
      const domain = {
        name: await rmrk.name(),
        version: '1',
        chainId: 31337,
        verifyingContract: rmrk.address,
      };

      // set the Permit type parameters
      const types = {
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      };

      // set the Permit type values
      const values = {
        owner: holder1.address,
        spender: holder2.address,
        value: allowance,
        nonce: nonces,
        deadline: deadline,
      };

      // sign the Permit type data with the deployer's private key
      const signature = await holder1._signTypedData(domain, types, values);
      const { v, r, s } = ethers.utils.splitSignature(signature);
      await rmrk
        .connect(holder2)
        .permit(holder1.address, holder2.address, allowance, deadline, v, r, s);
      expect(await rmrk.allowance(holder1.address, holder2.address)).to.equal(allowance);

      await rmrk.connect(holder2).transferFrom(holder1.address, holder2.address, allowance);
      expect(await rmrk.balanceOf(holder1.address)).to.equal(ethers.utils.parseEther('90'));
      expect(await rmrk.balanceOf(holder2.address)).to.equal(ethers.utils.parseEther('10'));
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

      await migrator
        .connect(deployer)
        .migrate(1, [holder1.address, holder2.address], [amountHolder1, amountHolder2]);
      expect(await rmrk.balanceOf(holder1.address)).to.equal(amountHolder1.mul(10 ** 8));
      expect(await rmrk.balanceOf(holder2.address)).to.equal(amountHolder2.mul(10 ** 8));
    });

    it('cannot swap legacy tokens when paused', async function () {
      await migrator.connect(deployer).pause();
      const swapAmount = ethers.utils.parseUnits('40', 10);
      await legacyRMRK.connect(holder1).approve(migrator.address, swapAmount);
      await expect(
        migrator.connect(holder1).swapLegacyRMRK(swapAmount, holder1.address),
      ).to.be.revertedWithCustomError(migrator, 'EnforcedPause');
    });

    it('cannot migrate tokens when paused', async function () {
      await migrator.connect(deployer).pause();
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await expect(
        migrator
          .connect(deployer)
          .migrate(1, [holder1.address, holder2.address], [amountHolder1, amountHolder2]),
      ).to.be.revertedWithCustomError(migrator, 'EnforcedPause');
    });

    it('cannot migrate tokens for the same batch and account twice', async function () {
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await migrator
        .connect(deployer)
        .migrate(1, [holder1.address, holder2.address], [amountHolder1, amountHolder2]);
      await expect(
        migrator
          .connect(deployer)
          .migrate(1, [holder1.address, holder2.address], [amountHolder1, amountHolder2]),
      ).to.be.revertedWithCustomError(migrator, 'MigrationFoundForBatchAndAccount');
    });

    it('can migrate tokens for different batch and same account', async function () {
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await migrator
        .connect(deployer)
        .migrate(1, [holder1.address, holder2.address], [amountHolder1, amountHolder2]);
      await migrator
        .connect(deployer)
        .migrate(2, [holder1.address, holder2.address], [amountHolder1, amountHolder2]);
      expect(await rmrk.balanceOf(holder1.address)).to.equal(amountHolder1.mul(10 ** 8).mul(2));
      expect(await rmrk.balanceOf(holder2.address)).to.equal(amountHolder2.mul(10 ** 8).mul(2));
      expect(await migrator.migratedAmount(1, holder1.address)).to.equal(
        amountHolder1.mul(10 ** 8),
      );
      expect(await migrator.migratedAmount(2, holder1.address)).to.equal(
        amountHolder1.mul(10 ** 8),
      );
    });

    it('can migrate tokens for same batch and different account', async function () {
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await migrator.connect(deployer).migrate(1, [holder1.address], [amountHolder1]);
      await migrator.connect(deployer).migrate(2, [holder2.address], [amountHolder2]);
      expect(await rmrk.balanceOf(holder1.address)).to.equal(amountHolder1.mul(10 ** 8));
      expect(await rmrk.balanceOf(holder2.address)).to.equal(amountHolder2.mul(10 ** 8));
    });

    it('cannot migrate tokens if lenght of amounts and tos do not match', async function () {
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await expect(
        migrator.connect(deployer).migrate(1, [holder1.address], [amountHolder1, amountHolder2]),
      ).to.be.revertedWithCustomError(migrator, 'ArrayLenghtsDoNotMatch');
      await expect(
        migrator.connect(deployer).migrate(1, [holder1.address, holder2.address], [amountHolder1]),
      ).to.be.revertedWithCustomError(migrator, 'ArrayLenghtsDoNotMatch');
    });

    it('cannot migrate tokens if not owner', async function () {
      const amountHolder1 = ethers.utils.parseUnits('100', 10);
      const amountHolder2 = ethers.utils.parseUnits('200', 10);
      await expect(
        migrator
          .connect(holder1)
          .migrate(1, [holder1.address, holder2.address], [amountHolder1, amountHolder2]),
      ).to.be.revertedWithCustomError(migrator, 'OwnableUnauthorizedAccount');
    });

    it('can pause/unpause if owner', async function () {
      await migrator.connect(deployer).pause();
      expect(await migrator.paused()).to.equal(true);
      await migrator.connect(deployer).unpause();
      expect(await migrator.paused()).to.equal(false);
    });

    it('cannot pause/unpause if not owner', async function () {
      await expect(migrator.connect(holder1).pause()).to.be.revertedWithCustomError(
        migrator,
        'UnauthorizedPause',
      );
      await expect(migrator.connect(holder1).unpause()).to.be.revertedWithCustomError(
        migrator,
        'OwnableUnauthorizedAccount',
      );
    });
  });
});
