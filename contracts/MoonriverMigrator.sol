// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IMintableBurnableERC20} from "./interfaces/IMintableBurnableERC20.sol";

error BatchNotStarted();
error BatchNotMigrating();

contract MoonriverMigrator is Ownable, Pausable {
    enum State {
        NotStarted,
        Started,
        Migrating,
        Finished
    }

    event BatchStarted(uint256 indexed batch);
    event BatchMigrating(uint256 indexed batch, uint256 amount);
    event BatchFinished(uint256 indexed batch, uint256 amount);
    event Migrated(
        uint256 indexed batch,
        address indexed holder,
        uint256 amount
    );

    IMintableBurnableERC20 public immutable LEGACY_RMRK;
    uint256 public currentBatch;
    uint256 public maxHoldersPerBatch;
    mapping(uint256 batch => State state) public batchState;
    mapping(uint256 batch => mapping(address holder => uint256 balance))
        public balancePerHolderAndBatch;
    mapping(uint256 batch => uint256 balance) public balancePerBatch;
    mapping(uint256 batch => mapping(address holder => uint256 index))
        private _indexPerHolderAndBatch;
    mapping(uint256 batch => address[] holders) private _holdersPerBatch;

    modifier onlyActiveBatch() {
        _checkActiveBatch();
        _;
    }

    constructor(address legacyRmrk_) Ownable(_msgSender()) {
        LEGACY_RMRK = IMintableBurnableERC20(legacyRmrk_);
        maxHoldersPerBatch = 100;
    }

    function migrate(uint256 amount) external whenNotPaused onlyActiveBatch {
        if (
            _holdersPerBatch[currentBatch].length == maxHoldersPerBatch &&
            balancePerHolderAndBatch[currentBatch][_msgSender()] == 0
        ) {
            _startNextBatch();
        }
        LEGACY_RMRK.transferFrom(_msgSender(), address(this), amount);
        balancePerBatch[currentBatch] += amount;
        balancePerHolderAndBatch[currentBatch][_msgSender()] += amount;
        if (_indexPerHolderAndBatch[currentBatch][_msgSender()] == 0) {
            _holdersPerBatch[currentBatch].push(_msgSender());

            _indexPerHolderAndBatch[currentBatch][
                _msgSender()
            ] = _holdersPerBatch[currentBatch].length; // Index starts at 1 so we can check if it exists. It is ok since indexes are actually not used, we are simply simulating a set here
        }
        emit Migrated(currentBatch, _msgSender(), amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function startNextBatch() external onlyOwner {
        _startNextBatch();
    }

    function _startNextBatch() private {
        currentBatch++;
        batchState[currentBatch] = State.Started;
        emit BatchStarted(currentBatch);
    }

    function startMigratingBatch(uint256 batch) external onlyOwner {
        if (batchState[batch] != State.Started) {
            revert BatchNotStarted();
        }
        batchState[batch] = State.Migrating;
        emit BatchMigrating(batch, balancePerBatch[batch]);
    }

    function finishBatch(uint256 batch) external onlyOwner {
        if (batchState[batch] != State.Migrating) {
            revert BatchNotMigrating();
        }
        LEGACY_RMRK.burn(balancePerBatch[batch]);
        batchState[batch] = State.Finished;
        emit BatchFinished(batch, balancePerBatch[batch]);
    }

    function setMaxHoldersPerBatch(
        uint256 maxHoldersPerBatch_
    ) external onlyOwner {
        maxHoldersPerBatch = maxHoldersPerBatch_;
    }

    function getHoldersPerBatch(
        uint256 batch
    ) external view returns (address[] memory holders) {
        holders = _holdersPerBatch[batch];
    }

    function getMigrationsForBatch(
        uint256 batch
    )
        external
        view
        returns (address[] memory holders, uint256[] memory amounts)
    {
        uint256 length = _holdersPerBatch[batch].length;
        holders = new address[](length);
        amounts = new uint256[](length);
        for (uint256 i; i < length; ) {
            holders[i] = _holdersPerBatch[batch][i];
            amounts[i] = balancePerHolderAndBatch[batch][holders[i]];
            unchecked {
                ++i;
            }
        }
    }

    function _checkActiveBatch() internal view {
        if (batchState[currentBatch] != State.Started) {
            revert BatchNotStarted();
        }
    }
}
