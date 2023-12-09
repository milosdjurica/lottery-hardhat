import { deployments, ethers, getNamedAccounts } from "hardhat";
import { Lottery } from "../../typechain-types";
import { assert, expect } from "chai";

describe("Lottery", () => {
	let lottery: Lottery;
	let deployer: string;
	const TICKET_PRICE = 20;

	beforeEach(async () => {
		await deployments.fixture(["all"]);
		deployer = (await getNamedAccounts()).deployer;
		lottery = await ethers.getContract("Lottery", deployer);
		// console.log("lottery", lottery);
	});

	describe("constructor", () => {
		it("sets ticket price correctly", async () => {
			const response = await lottery.getTicketPrice();
			assert.equal(TICKET_PRICE, Number(response));
		});
	});

	describe("enterLottery", () => {
		it("reverts if called without money", async () => {
			await expect(lottery.enterLottery()).to.be.revertedWithCustomError(
				lottery,
				"Lottery__NotEnoughETH",
			);
		});
		it("reverts if not enough money", async () => {
			await expect(
				lottery.enterLottery({ value: TICKET_PRICE - 1 }),
			).to.be.revertedWithCustomError(lottery, "Lottery__NotEnoughETH");
		});

		it("adds to array of players", async () => {
			const accounts = await ethers.getSigners();
			const lotteryConnected = lottery.connect(accounts[1]);
			await lotteryConnected.enterLottery({
				value: TICKET_PRICE,
			});
			assert.equal(accounts[1].address, await lottery.getPlayer(0));
		});
	});
});
