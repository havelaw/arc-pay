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
        uint256 perPerson
    );

    event SharePaid(
        uint256 indexed splitId,
        address indexed payer,
        uint256 amount
    );

    event SplitSettled(uint256 indexed splitId);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createSplit(
        string calldata _title,
        uint256 _totalAmount,
        uint8 _memberCount
    ) external returns (uint256) {
        require(_memberCount >= 2, "Need at least 2 people");
        require(_totalAmount > 0, "Amount must be > 0");

        uint256 perPerson = _totalAmount / _memberCount;
        require(perPerson > 0, "Per person amount too small");

        uint256 splitId = splitCount++;

        splits[splitId] = Split({
            creator: msg.sender,
            title: _title,
            totalAmount: _totalAmount,
            perPerson: perPerson,
            memberCount: _memberCount,
            paidCount: 1,
            settled: _memberCount == 1,
            createdAt: block.timestamp
        });

        emit SplitCreated(
            splitId,
            msg.sender,
            _title,
            _totalAmount,
            _memberCount,
            perPerson
        );

        return splitId;
    }

    function payShare(uint256 _splitId) external {
        Split storage s = splits[_splitId];
        require(s.creator != address(0), "Split does not exist");
        require(!s.settled, "Already settled");
        require(!hasPaid[_splitId][msg.sender], "Already paid");
        require(msg.sender != s.creator, "Creator cannot pay self");

        hasPaid[_splitId][msg.sender] = true;
        s.paidCount++;

        usdc.safeTransferFrom(msg.sender, s.creator, s.perPerson);

        emit SharePaid(_splitId, msg.sender, s.perPerson);

        if (s.paidCount == s.memberCount) {
            s.settled = true;
            emit SplitSettled(_splitId);
        }
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
            uint256 createdAt
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
            s.createdAt
        );
    }
}
