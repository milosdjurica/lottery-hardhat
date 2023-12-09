// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

////////////////////
// * Imports 	  //
////////////////////
// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract Lottery is VRFConsumerBaseV2 {
	////////////////////
	// * Errors 	  //
	////////////////////
	error Lottery__NotEnoughETH();

	////////////////////
	// * Types 		  //
	////////////////////

	////////////////////
	// * Variables	  //
	////////////////////
	uint private immutable i_ticketPrice;
	address payable[] private s_players;
	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

	////////////////////
	// * Events 	  //
	////////////////////
	event LotteryEnter(address indexed player);

	////////////////////
	// * Modifiers 	  //
	////////////////////

	////////////////////
	// * Functions	  //
	////////////////////

	////////////////////
	// * Constructor  //
	////////////////////
	constructor(
		address _vrfCoordinatorV2,
		uint _ticketPrice
	) VRFConsumerBaseV2(_vrfCoordinatorV2) {
		i_ticketPrice = _ticketPrice;
		i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
	}

	////////////////////////////
	// * Receive & Fallback   //
	////////////////////////////

	////////////////////
	// * External 	  //
	////////////////////

	////////////////////
	// * Public 	  //
	////////////////////
	function enterLottery() public payable {
		if (msg.value < i_ticketPrice) revert Lottery__NotEnoughETH();

		s_players.push(payable(msg.sender));
		emit LotteryEnter(msg.sender);
	}

	function requestRandomWinner() external {}

	function fulfillRandomWords(
		uint requestId,
		uint[] memory randomWords
	) internal override {}

	////////////////////
	// * Internal 	  //
	////////////////////

	////////////////////
	// * Private 	  //
	////////////////////

	////////////////////
	// * View & Pure  //
	////////////////////

	function getTicketPrice() public view returns (uint) {
		return i_ticketPrice;
	}

	function getPlayer(uint index) public view returns (address) {
		return s_players[index];
	}
}
