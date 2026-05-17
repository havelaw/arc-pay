// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ArcSplit} from "../contracts/ArcSplit.sol";
import {MockUSDC} from "../contracts/MockUSDC.sol";

contract ArcSplitTest is Test {
    ArcSplit public arcSplit;
    MockUSDC public usdc;

    address creator = address(0x1);
    address alice = address(0x2);
    address bob = address(0x3);

    uint256 constant TOTAL = 30e6; // 30 USDC
    uint256 constant PER_PERSON = 10e6; // 10 USDC

    function setUp() public {
        usdc = new MockUSDC();
        arcSplit = new ArcSplit(address(usdc));

        usdc.mint(alice, 1000e6);
        usdc.mint(bob, 1000e6);

        vm.prank(alice);
        usdc.approve(address(arcSplit), type(uint256).max);

        vm.prank(bob);
        usdc.approve(address(arcSplit), type(uint256).max);
    }

    function test_createSplit() public {
        vm.prank(creator);
        uint256 splitId = arcSplit.createSplit("Dinner", TOTAL, 3);

        (
            address c, string memory title, uint256 total,
            uint256 pp, uint8 mc, uint8 pc, bool settled,
        ) = arcSplit.getSplit(splitId);

        assertEq(c, creator);
        assertEq(title, "Dinner");
        assertEq(total, TOTAL);
        assertEq(pp, PER_PERSON);
        assertEq(mc, 3);
        assertEq(pc, 1);
        assertFalse(settled);
    }

    function test_revert_lessThan2Members() public {
        vm.prank(creator);
        vm.expectRevert("Need at least 2 people");
        arcSplit.createSplit("Solo", TOTAL, 1);
    }

    function test_revert_zeroAmount() public {
        vm.prank(creator);
        vm.expectRevert("Amount must be > 0");
        arcSplit.createSplit("Free", 0, 2);
    }

    function test_payShare() public {
        vm.prank(creator);
        arcSplit.createSplit("Dinner", TOTAL, 3);

        uint256 balBefore = usdc.balanceOf(creator);

        vm.prank(alice);
        arcSplit.payShare(0);

        assertEq(usdc.balanceOf(creator) - balBefore, PER_PERSON);
        assertTrue(arcSplit.hasPaid(0, alice));
    }

    function test_revert_doublePay() public {
        vm.prank(creator);
        arcSplit.createSplit("Dinner", TOTAL, 3);

        vm.prank(alice);
        arcSplit.payShare(0);

        vm.prank(alice);
        vm.expectRevert("Already paid");
        arcSplit.payShare(0);
    }

    function test_revert_creatorPaySelf() public {
        vm.prank(creator);
        arcSplit.createSplit("Dinner", TOTAL, 3);

        vm.prank(creator);
        vm.expectRevert("Creator cannot pay self");
        arcSplit.payShare(0);
    }

    function test_settleWhenAllPaid() public {
        vm.prank(creator);
        arcSplit.createSplit("Dinner", TOTAL, 3);

        vm.prank(alice);
        arcSplit.payShare(0);

        vm.prank(bob);
        arcSplit.payShare(0);

        (,,,,, uint8 pc, bool settled,) = arcSplit.getSplit(0);
        assertEq(pc, 3);
        assertTrue(settled);
    }

    function test_revert_payAfterSettle() public {
        vm.prank(creator);
        arcSplit.createSplit("Dinner", TOTAL, 3);

        vm.prank(alice);
        arcSplit.payShare(0);

        vm.prank(bob);
        arcSplit.payShare(0);

        address charlie = address(0x4);
        usdc.mint(charlie, 100e6);
        vm.prank(charlie);
        usdc.approve(address(arcSplit), type(uint256).max);

        vm.prank(charlie);
        vm.expectRevert("Already settled");
        arcSplit.payShare(0);
    }
}
