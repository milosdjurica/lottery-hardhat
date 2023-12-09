// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

////////////////////
// * Imports 	  //
////////////////////
// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

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
		address vrfCoordinator,
		uint _ticketPrice
	) VRFConsumerBaseV2(vrfCoordinator) {
		i_ticketPrice = _ticketPrice;
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
