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
	error Lottery__TransferFailed();
	error Lottery__NotOpen();

	////////////////////
	// * Types 		  //
	////////////////////
	enum LotteryState {
		OPEN,
		CALCULATING
	}

	////////////////////
	// * Variables	  //
	////////////////////
	uint private immutable i_ticketPrice;
	address payable[] private s_players;
	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
	bytes32 private immutable i_gasLane;
	uint64 i_subscriptionId;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint32 private immutable i_callbackGasLimit;
	uint32 private constant NUM_WORDS = 1;

	address private s_recentWinner;
	LotteryState s_lotteryState;

	////////////////////
	// * Events 	  //
	////////////////////
	event LotteryEnter(address indexed player);
	event RequestedLotteryWinner(uint indexed requestId);
	event WinnerPicked(address indexed winner);

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
		uint _ticketPrice,
		bytes32 _gasLane,
		uint64 _subscriptionId,
		uint32 _callbackGasLimit
	) VRFConsumerBaseV2(_vrfCoordinatorV2) {
		i_ticketPrice = _ticketPrice;
		i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
		i_gasLane = _gasLane;
		i_subscriptionId = _subscriptionId;
		i_callbackGasLimit = _callbackGasLimit;
		s_lotteryState = LotteryState.OPEN;
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
		if (s_lotteryState != LotteryState.OPEN) revert Lottery__NotOpen();

		s_players.push(payable(msg.sender));
		emit LotteryEnter(msg.sender);
	}

	function checkUpkeep(bytes calldata /*checkData*/) public view {}

	function requestRandomWinner() external {
		s_lotteryState = LotteryState.CALCULATING;
		uint requestId = i_vrfCoordinator.requestRandomWords(
			i_gasLane,
			i_subscriptionId,
			REQUEST_CONFIRMATIONS,
			i_callbackGasLimit,
			NUM_WORDS
		);
		emit RequestedLotteryWinner(requestId);
	}

	function fulfillRandomWords(
		uint, // requestId,
		uint[] memory randomWords
	) internal override {
		uint winnerIndex = randomWords[0] % s_players.length;
		address payable recentWinner = s_players[winnerIndex];
		s_recentWinner = recentWinner;
		s_lotteryState = LotteryState.OPEN;
		delete s_players;
		(bool success, ) = recentWinner.call{value: address(this).balance}("");
		if (!success) revert Lottery__TransferFailed();
		emit WinnerPicked(recentWinner);
	}

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

	function getRecentWinner() public view returns (address) {
		return s_recentWinner;
	}
}
