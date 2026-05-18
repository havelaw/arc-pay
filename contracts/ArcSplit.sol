// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ArcSplit {
    using SafeERC20 for IERC20;

    struct Split {
        address creator;
        string title;
        uint256 totalAmount;
        uint256 perPerson;
        uint8 memberCount;
        uint8 paidCount;
        bool settled;
        uint256 createdAt;
        bytes32 secretHash;
        uint256 claimable;
        uint256 claimed;
    }

    IERC20 public immutable usdc;
    uint256 public splitCount;

    mapping(uint256 => Split) public splits;
    mapping(uint256 => mapping(address => bool)) public hasPaid;

    event SplitCreated(
        uint256 indexed splitId,
        address indexed creator,
        string title,
        uint256 totalAmount,
        uint8 memberCount,
        uint256 perPerson,
        bytes32 secretHash
    );

    event SharePaid(
        uint256 indexed splitId,
        address indexed payer,
        uint256 amount
    );

    event SplitSettled(uint256 indexed splitId);

    event Claimed(
        uint256 indexed splitId,
        address indexed creator,
        uint256 amount
    );

    event SplitCancelled(uint256 indexed splitId);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createSplit(
        string calldata _title,
        uint256 _totalAmount,
        uint8 _memberCount,
        bytes32 _secretHash
    ) external returns (uint256) {
        require(_memberCount >= 2, "Need at least 2 people");
        require(_totalAmount > 0, "Amount must be > 0");
        require(_secretHash != bytes32(0), "Secret required");

        uint256 perPerson = _totalAmount / _memberCount;
        require(perPerson > 0, "Per person amount too small");

        uint256 splitId = splitCount++;

        Split storage s = splits[splitId];
        s.creator = msg.sender;
        s.title = _title;
        s.totalAmount = _totalAmount;
        s.perPerson = perPerson;
        s.memberCount = _memberCount;
        s.paidCount = 0;
        s.settled = false;
        s.createdAt = block.timestamp;
        s.secretHash = _secretHash;
        s.claimable = 0;
        s.claimed = 0;

        emit SplitCreated(
            splitId,
            msg.sender,
            _title,
            _totalAmount,
            _memberCount,
            perPerson,
            _secretHash
        );

        return splitId;
    }

    function payShare(uint256 _splitId, bytes32 _secret) external {
        Split storage s = splits[_splitId];
        require(s.creator != address(0), "Split does not exist");
        require(!s.settled, "Already settled");
        require(!hasPaid[_splitId][msg.sender], "Already paid");
        require(keccak256(abi.encodePacked(_secret)) == s.secretHash, "Invalid secret");

        hasPaid[_splitId][msg.sender] = true;
        s.paidCount++;
        s.claimable += s.perPerson;

        usdc.safeTransferFrom(msg.sender, address(this), s.perPerson);

        emit SharePaid(_splitId, msg.sender, s.perPerson);

        if (s.paidCount == s.memberCount) {
            s.settled = true;
            emit SplitSettled(_splitId);
        }
    }

    function claim(uint256 _splitId) external {
        Split storage s = splits[_splitId];
        require(msg.sender == s.creator, "Only creator can claim");
        uint256 amount = s.claimable - s.claimed;
        require(amount > 0, "Nothing to claim");

        s.claimed += amount;
        usdc.safeTransfer(s.creator, amount);

        emit Claimed(_splitId, s.creator, amount);
    }

    function cancelSplit(uint256 _splitId) external {
        Split storage s = splits[_splitId];
        require(msg.sender == s.creator, "Only creator can cancel");
        require(!s.settled, "Already settled");

        uint256 unclaimed = s.claimable - s.claimed;
        if (unclaimed > 0) {
            s.claimed += unclaimed;
            usdc.safeTransfer(s.creator, unclaimed);
        }

        s.settled = true;
        emit SplitCancelled(_splitId);
    }

    function getSplit(uint256 _splitId)
        external
        view
        returns (
            address creator,
            string memory title,
            uint256 totalAmount,
            uint256 perPerson,
            uint8 memberCount,
            uint8 paidCount,
            bool settled,
            uint256 createdAt,
            bytes32 secretHash,
            uint256 claimable,
            uint256 claimed
        )
    {
        Split storage s = splits[_splitId];
        return (
            s.creator,
            s.title,
            s.totalAmount,
            s.perPerson,
            s.memberCount,
            s.paidCount,
            s.settled,
            s.createdAt,
            s.secretHash,
            s.claimable,
            s.claimed
        );
    }
}
