// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IRMRK.sol";

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

    IRMRK public immutable legacyRmrk;
    uint256 public currentBatch;
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

    constructor(address legacyRmrk_) {
        legacyRmrk = IRMRK(legacyRmrk_);
    }

    function migrate(uint256 amount) public whenNotPaused onlyActiveBatch {
        legacyRmrk.transferFrom(msg.sender, address(this), amount);
        balancePerBatch[currentBatch] += amount;
        balancePerHolderAndBatch[currentBatch][msg.sender] += amount;
        if (_indexPerHolderAndBatch[currentBatch][msg.sender] == 0) {
            _holdersPerBatch[currentBatch].push(msg.sender);

            _indexPerHolderAndBatch[currentBatch][
                msg.sender
            ] = _holdersPerBatch[currentBatch].length; // Index starts at 1 so we can check if it exists. It is ok since indexes are actually not used, we are simply simulating a set here
        }
        emit Migrated(currentBatch, msg.sender, amount);
        if (_holdersPerBatch[currentBatch].length == 100) {
            _startNextBatch();
        }
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function startNextBatch() public onlyOwner {
        _startNextBatch();
    }

    function _startNextBatch() private {
        currentBatch++;
        batchState[currentBatch] = State.Started;
        emit BatchStarted(currentBatch);
    }

    function startMigratingBatch(uint256 batch) public onlyOwner {
        require(batchState[batch] == State.Started, "Batch not started");
        batchState[batch] = State.Migrating;
        emit BatchMigrating(batch, balancePerBatch[batch]);
    }

    function finishBatch(uint256 batch) public onlyOwner {
        require(batchState[batch] == State.Migrating, "Batch not migrating");
        legacyRmrk.burn(balancePerBatch[batch]);
        batchState[batch] = State.Finished;
        emit BatchFinished(batch, balancePerBatch[batch]);
    }

    function getHoldersPerBatch(
        uint256 batch
    ) public view returns (address[] memory holders) {
        holders = _holdersPerBatch[batch];
    }

    function getMigrationsForBatch(
        uint256 batch
    ) public view returns (address[] memory holders, uint256[] memory amounts) {
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
        require(batchState[currentBatch] == State.Started, "Batch not started");
    }
}
