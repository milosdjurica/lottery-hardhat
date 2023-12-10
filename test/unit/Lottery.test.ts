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
					assert.equal(
						interval.toString(),
						networkConfig[chainId].keepersUpdateInterval,
					);
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
						lottery.enterLottery({ value: TICKET_PRICE / BigInt(2) }),
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

				it("emits LotteryEnter event after entering lottery", async () => {
					expect(
						await lottery.enterLottery({
							value: TICKET_PRICE,
						}),
					).to.emit(lottery, "LotteryEnter");
				});
			});
	  });
