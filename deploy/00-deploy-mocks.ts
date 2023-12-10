import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains } from "../helper-config";
import { ethers, network } from "hardhat";

const BASE_FEE = ethers.parseEther("0.25"); // paying 0.25 LINK every time random numbers are requested
const GAS_PRICE_LINK = 1e9; // calculated value based on the gas price of the chain

const deployMock: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment,
) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, log } = hre.deployments;

	if (!developmentChains.includes(network.name)) {
		console.log("Local network detected! Deploying mocks...");

		await deploy("VRFCoordinatorV2Mock", {
			from: deployer,
			args: [BASE_FEE, GAS_PRICE_LINK],
			log: true,
		});

		log("Mocks deployed!!!");
		log("===============================================================");
	}

	const mock = await deploy("Mock", {
		from: deployer,
		args: [],
		log: true,
	});

	console.log(`Mock contract: `, mock.address);
};
export default deployMock;
deployMock.id = "deployer_mock"; // id required to prevent re-execution
deployMock.tags = ["Mock", "all"];
