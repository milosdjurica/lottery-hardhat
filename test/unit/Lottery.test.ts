import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { assert, expect } from "chai";
import { developmentChains, networkConfig } from "../../helper-config";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Lottery Unit Tests", () => {
			let lottery: Lottery;
			let deployer: string;
			let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
			const chainId = network.config.chainId!;
			const TICKET_PRICE = networkConfig[chainId].lotteryTicketPrice;
			const INTERVAL = networkConfig[chainId].keepersUpdateInterval;

			beforeEach(async () => {
				await deployments.fixture(["all"]);
				deployer = (await getNamedAccounts()).deployer;
				vrfCoordinatorV2Mock = await ethers.getContract(
					"VRFCoordinatorV2Mock",
					deployer,
				);
				lottery = await ethers.getContract("Lottery", deployer);

				// console.log("lottery", lottery);
			});

			describe("Constructor", () => {
				it("Sets ticket price correctly", async () => {
					const ticketPrice = await lottery.getTicketPrice();
					assert.equal(TICKET_PRICE, ticketPrice);
				});

				it("Sets vrfCoordinatorCorrectly", async () => {
					const vrfCoordinatorLottery = await lottery.getVrfCoordinator();
					assert.equal(
						await vrfCoordinatorV2Mock.getAddress(),
						vrfCoordinatorLottery,
					);
				});

				it("Sets lottery state to open", async () => {
					const lotteryState = await lottery.getLotteryState();
					assert.equal(Number(lotteryState), 0);
				});

				it("Sets interval correctly", async () => {
					const interval = await lottery.getInterval();
					assert.equal(interval.toString(), INTERVAL);
				});
			});

			describe("EnterLottery Function", () => {
				it("Reverts if called without money", async () => {
					await expect(lottery.enterLottery()).to.be.revertedWithCustomError(
						lottery,
						"Lottery__NotEnoughETH",
					);
				});
				it("Reverts if not enough money", async () => {
					await expect(
						lottery.enterLottery({ value: TICKET_PRICE / BigInt(2) }),
					).to.be.revertedWithCustomError(lottery, "Lottery__NotEnoughETH");
				});

				it("Adds to array of players", async () => {
					const accounts = await ethers.getSigners();
					const lotteryConnected = lottery.connect(accounts[1]);
					await lotteryConnected.enterLottery({
						value: TICKET_PRICE,
					});
					assert.equal(accounts[1].address, await lottery.getPlayer(0));
				});

				it("Emits LotteryEnter event after entering lottery", async () => {
					expect(
						await lottery.enterLottery({
							value: TICKET_PRICE,
						}),
					).to.emit(lottery, "LotteryEnter");
				});

				it("Doesn't allow entrance when lottery is not in OPEN STATE", async () => {
					/**
					 * Doing all this to make checkUpkeep return TRUE ->
					 * that will automatically call performUpkeep -> and it will set state to CALCULATING
					 */

					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);
					// TODO Have to add subscriptionId in order for mock to work
					// TODO and then performUpkeep will work
					await lottery.performUpkeep("");
					await expect(
						lottery.enterLottery({ value: TICKET_PRICE }),
					).to.be.revertedWith("Lottery__NotOpen");
				});
			});
	  });
