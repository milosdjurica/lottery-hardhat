import { ethers } from "hardhat";

export type NetworkConfigItem = {
	name: string;
	vrfCoordinatorV2?: string;
	lotteryTicketPrice: bigint;
	gasLane: string;
	subscriptionId?: string;
	callbackGasLimit: string;
	keepersUpdateInterval: string;
};

export type NetworkConfigInfo = {
	[key: number]: NetworkConfigItem;
};

export const networkConfig: NetworkConfigInfo = {
	11155111: {
		name: "sepolia",
		vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
		lotteryTicketPrice: ethers.parseEther("0.01"), // 0.01 ether
		gasLane:
			"0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
		subscriptionId: "0", //  !!! add subscription!!!!
		callbackGasLimit: "500000", // 500 000
		keepersUpdateInterval: "30",
	},
	31337: {
		name: "hardhat",
		lotteryTicketPrice: ethers.parseEther("0.01"), // 0.01 ether
		gasLane:
			"0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
		callbackGasLimit: "500000", // 500 000
		keepersUpdateInterval: "30",
	},
};

export const developmentChains = ["hardhat", "localhost"];
