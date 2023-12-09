import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployLottery: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment,
) {
	const { deployer, log } = await hre.getNamedAccounts();
	const { deploy } = hre.deployments;

	let vrfCoordinatorV2;
	const TICKET_PRICE = 20;
	let gasLane;
	let subscriptionId;
	let callbackGasLimit;

	const constructorArgs = [
		vrfCoordinatorV2,
		TICKET_PRICE,
		gasLane,
		subscriptionId,
		callbackGasLimit,
	];

	const lottery = await deploy("Lottery", {
		from: deployer,
		args: constructorArgs,
		log: true,
	});

	console.log(`Lottery contract: `, lottery.address);
};
export default deployLottery;
deployLottery.id = "deployer_lottery"; // id required to prevent re-execution
deployLottery.tags = ["Lottery", "all"];
