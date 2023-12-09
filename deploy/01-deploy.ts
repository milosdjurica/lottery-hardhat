import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployLottery: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment,
) {
	const { deployer, log } = await hre.getNamedAccounts();
	const { deploy } = hre.deployments;

	const lottery = await deploy("Lottery", {
		from: deployer,
		args: [20], // ! constructor args
		log: true,
	});

	console.log(`Lottery contract: `, lottery.address);
};
export default deployLottery;
deployLottery.id = "deployer_lottery"; // id required to prevent re-execution
deployLottery.tags = ["Lottery", "all"];
