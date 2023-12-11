import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { assert, expect } from "chai";
import { developmentChains, networkConfig } from "../../helper-config";
import { EventLog } from "ethers";

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
					await lottery.performUpkeep("0x");
					await expect(
						lottery.enterLottery({ value: TICKET_PRICE }),
					).to.be.revertedWithCustomError(lottery, "Lottery__NotOpen");
				});
			});

			describe("CheckUpkeep", () => {
				it("Returns false if people haven't sent any ETH", async () => {
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);
					const { upkeepNeeded } = await lottery.checkUpkeep.staticCall("0x");
					assert(!upkeepNeeded);
				});

				it("Returns false if lottery isn't in OPEN STATE", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);

					await lottery.performUpkeep("0x");
					const lotteryState = await lottery.getLotteryState();
					const { upkeepNeeded } = await lottery.checkUpkeep.staticCall("0x");
					assert.equal(lotteryState.toString(), "1");
					assert.equal(upkeepNeeded, false);
				});

				it("Returns false if not enough time has passed", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) - 2,
					]);
					await network.provider.send("evm_mine", []);
					const { upkeepNeeded } = await lottery.checkUpkeep.staticCall("0x");
					assert(!upkeepNeeded);
				});

				it("Returns true if all conditions are fulfilled", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);
					const { upkeepNeeded } = await lottery.checkUpkeep.staticCall("0x");
					assert(upkeepNeeded);
				});
			});

			describe("PerformUpkeep", () => {
				it("only run if checkUpkeep is true", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);
					const tx = await lottery.performUpkeep("0x");
					assert(tx);
				});

				it("reverts if checkUpkeep is false", async () => {
					await expect(
						lottery.performUpkeep("0x"),
					).to.be.revertedWithCustomError(lottery, "Lottery__UpkeepNotNeeded");
				});

				it("updates the lottery state", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);
					const txResponse = await lottery.performUpkeep("0x");
					const txReceipt = await txResponse.wait(1);
					assert.equal(Number(await lottery.getLotteryState()), 1);
				});

				it("emits the event", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);
					const txResponse = await lottery.performUpkeep("0x");
					const txReceipt = await txResponse.wait(1);
					const requestId = (txReceipt?.logs[1] as EventLog).args.requestId;
					// console.log("requestId", requestId);
					assert(Number(requestId) > 0);
				});
			});

			describe("FulfillRandomWords", () => {
				beforeEach(async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await network.provider.send("evm_increaseTime", [
						Number(INTERVAL) + 1,
					]);
					await network.provider.send("evm_mine", []);
				});

				it("Can not be called before performUpkeep", async () => {
					// ! Cant add revertedWithCustomError(vrfC...V2Mock, "nonexistent request")
					// ! Because contract error comes from chainlink contract
					await expect(
						vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.getAddress()),
					).to.be.revertedWith("nonexistent request");
					// ! Should be fuzz testing
					await expect(
						vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.getAddress()),
					).to.be.revertedWith("nonexistent request");
				});

				it("Picks a winner, resets the lottery and sends money", async () => {
					const participants = 3;
					const startingAccIndex = 1; // deployer = 1
					const accounts = await ethers.getSigners();

					for (
						let i = startingAccIndex;
						i < startingAccIndex + participants;
						i++
					) {
						const accConnected = lottery.connect(accounts[i]);
						await accConnected.enterLottery({ value: TICKET_PRICE });
					}

					const startingTimestamp = await lottery.getLatestTimeStamp();

					// performUpkeep (mock being chainlink keepers)
					// fulfillRandomWords (mock being chainlink VRF)
					// have to wait for the fulfillRandomWords to be called
					// ! Uncomment code below
					let winner: any;
					console.log("winner", winner);
					await new Promise<void>(async (resolve, reject) => {
						lottery.once(winner, async () => {
							console.log("Winner picked event is fired!");
							try {
								const recentWinner = await lottery.getRecentWinner();
								console.log("recentWinner", recentWinner);
								const lotteryState = await lottery.getLotteryState();
								const endingTimeStamp = await lottery.getLatestTimeStamp();
								const winnerEndBalance = await ethers.provider.getBalance(
									accounts[1].address,
								);

								await expect(lottery.getPlayer(0)).to.be.reverted;
								assert.equal(recentWinner.toString(), accounts[2].address);
								assert.equal(Number(lotteryState), 0);
								assert(endingTimeStamp > startingTimestamp);

								assert.equal(
									Number(winnerEndBalance),
									Number(winnerStartBalance) +
										Number(TICKET_PRICE) * participants +
										Number(TICKET_PRICE),
								);
								resolve();
							} catch (error) {
								reject(error);
							}
						});

						const tx = await lottery.performUpkeep("0x");
						const txReceipt = await tx.wait(1);
						const winnerStartBalance = await ethers.provider.getBalance(
							accounts[1].address,
						);
						await vrfCoordinatorV2Mock.fulfillRandomWords(
							(txReceipt?.logs[1] as EventLog).args.requestId,
							lottery.getAddress(),
						);
					});
				});
			});
	  });
