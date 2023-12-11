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
	error Lottery__UpkeepNotNeeded(
		uint balance,
		uint numPlayers,
		uint lotteryState
	);

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
	uint private s_lastTimeStamp;
	uint private immutable i_interval;

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
		uint32 _callbackGasLimit,
		uint _interval
	) VRFConsumerBaseV2(_vrfCoordinatorV2) {
		i_ticketPrice = _ticketPrice;
		i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
		i_gasLane = _gasLane;
		i_subscriptionId = _subscriptionId;
		i_callbackGasLimit = _callbackGasLimit;
		s_lotteryState = LotteryState.OPEN;
		s_lastTimeStamp = block.timestamp;
		i_interval = _interval;
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

	/**
	 * @dev This is the function that the Chainlink Keeper nodes call
	 * they look for the upkeepNeeded to return true
	 * The following should be true in order for upkeepNeeded to be true:
	 * 1. lottery should be in open state
	 * 2. time interval passed
	 * 3. lottery has at least 1 player -> 2 makes more sense, but this is just demo
	 * 4. our subscription is funnded with LINK
	 */
	function checkUpkeep(
		bytes memory /*checkData*/
	) public view returns (bool upkeepNeeded, bytes memory /* performData */) {
		bool isOpen = LotteryState.OPEN == s_lotteryState;
		bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
		bool hasPlayers = s_players.length > 0;
		bool hasBalance = address(this).balance > 0;
		upkeepNeeded = isOpen && timePassed && hasPlayers && hasBalance;
		return (upkeepNeeded, "0x0");
	}

	// TODO Maybe will have to change it to bytes memory bcz of tests!
	function performUpkeep(bytes calldata /* performData */) external {
		(bool upkeepNeeded, ) = checkUpkeep("");
		if (!upkeepNeeded)
			revert Lottery__UpkeepNotNeeded(
				address(this).balance,
				s_players.length,
				uint(s_lotteryState)
			);

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
		s_lastTimeStamp = block.timestamp;
		emit WinnerPicked(recentWinner);
		(bool success, ) = recentWinner.call{value: address(this).balance}("");
		if (!success) revert Lottery__TransferFailed();
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

	function getLotteryState() public view returns (LotteryState) {
		return s_lotteryState;
	}

	function getNumWords() public pure returns (uint) {
		return NUM_WORDS;
	}

	function getNumberOfPlayers() public view returns (uint) {
		return s_players.length;
	}

	function getLatestTimeStamp() public view returns (uint) {
		return s_lastTimeStamp;
	}

	function getRequestConfirmations() public pure returns (uint) {
		return REQUEST_CONFIRMATIONS;
	}

	function getVrfCoordinator()
		public
		view
		returns (VRFCoordinatorV2Interface)
	{
		return i_vrfCoordinator;
	}

	function getInterval() public view returns (uint) {
		return i_interval;
	}
}
