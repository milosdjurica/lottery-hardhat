import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains } from "../hardhat.config";
import { network } from "hardhat";

const deployLottery: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment,
) {
	const { deployer, log } = await hre.getNamedAccounts();
	const { deploy } = hre.deployments;

	if (developmentChains.includes(network.name)) {
		console.log("Local network detected! Deploying mocks...");
	}

	const lottery = await deploy("Lottery", {
		from: deployer,
		args: [],
		log: true,
	});

	console.log(`Lottery contract: `, lottery.address);
};
export default deployLottery;
deployLottery.id = "deployer_lottery"; // id required to prevent re-execution
deployLottery.tags = ["Lottery", "all"];
