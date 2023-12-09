import { deployments, ethers, getNamedAccounts } from "hardhat";
import { Lottery } from "../../typechain-types";
import { assert } from "chai";

describe("Lottery", () => {
	let lottery: Lottery;
	let deployer: string;
	const ticketPrice = 20;

	beforeEach(async () => {
		await deployments.fixture(["all"]);
		deployer = (await getNamedAccounts()).deployer;
		lottery = await ethers.getContract("Lottery", deployer);
		console.log("lottery", lottery);
	});

	describe("constructor", () => {
		it("sets ticket price correctly", async () => {
			const response = await lottery.getTicketPrice();
			assert.equal(ticketPrice, Number(response));
		});
	});
});
