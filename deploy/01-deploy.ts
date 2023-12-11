import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-config";
import { ethers, network } from "hardhat";
import { VRFCoordinatorV2Mock } from "../typechain-types";
import { verify } from "../utils/verify";

const deployLottery: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment,
) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, log } = hre.deployments;
	const chainId = network.config.chainId!;

	const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2");

	const TICKET_PRICE = networkConfig[chainId].lotteryTicketPrice;
	const gasLane = networkConfig[chainId].gasLane;
	const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
	const interval = networkConfig[chainId].keepersUpdateInterval;
	let vrfCoordinatorV2Address: string;
	let subscriptionId: string = networkConfig[chainId].subscriptionId;
	let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;

	if (developmentChains.includes(network.name)) {
		vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
		vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.getAddress();
		const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
		const transactionReceipt = await transactionResponse.wait(1);
		//@ts-ignore
		subscriptionId = await transactionReceipt?.logs[0].args.subId;
		await vrfCoordinatorV2Mock.fundSubscription(
			subscriptionId,
			VRF_SUB_FUND_AMOUNT,
		);
	} else {
		vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2!;
		subscriptionId = networkConfig[chainId].subscriptionId;
	}

	const waitBlockConfirmations = developmentChains.includes(network.name)
		? 1
		: 3;

	const constructorArgs = [
		vrfCoordinatorV2Address,
		TICKET_PRICE,
		gasLane,
		subscriptionId,
		callbackGasLimit,
		interval,
	];

	log("Deploying lottery contract....");
	const lottery = await deploy("Lottery", {
		from: deployer,
		args: constructorArgs,
		log: true,
		waitConfirmations: waitBlockConfirmations,
	});

	log(`Lottery contract: `, lottery.address);
	log("===============================================================");

	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		log("Verifying contract....");
		await verify(lottery.address, constructorArgs);
	} else {
		await vrfCoordinatorV2Mock.addConsumer(subscriptionId, lottery.address);
	}
	log("===============================================================");
};
export default deployLottery;
deployLottery.id = "deployer_lottery"; // id required to prevent re-execution
deployLottery.tags = ["lottery", "all"];
