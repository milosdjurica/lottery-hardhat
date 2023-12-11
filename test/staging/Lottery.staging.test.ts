import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Lottery } from "../../typechain-types";
import { assert, expect } from "chai";
import { developmentChains } from "../../helper-config";

developmentChains.includes(network.name)
	? describe.skip
	: describe("Lottery Staging Tests", () => {
			let lottery: Lottery;
			let deployer: string;
			let ticketPrice: bigint;

			beforeEach(async () => {
				await deployments.fixture(["all"]);
				deployer = (await getNamedAccounts()).deployer;

				lottery = await ethers.getContract("Lottery", deployer);
				ticketPrice = await lottery.getTicketPrice();

				// console.log("lottery", lottery);
			});

			describe("FulfillRandomWords", () => {
				it("Works with live Chainlink Keepers and Chainlink VRF, we get a random winner!", async () => {
					console.log("Setting up test...");
					const startingTimestamp = await lottery.getLatestTimeStamp();
					const accounts = await ethers.getSigners();

					console.log("Setting up Listener...");
					await new Promise<void>(async (resolve, reject) => {
						lottery.once("WinnerPicked", async () => {
							console.log("WinnerPicked event is fired");
							try {
								const recentWinner = await lottery.getRecentWinner();
								const lotteryState = await lottery.getLotteryState();
								const winnerEndBalance = await ethers.provider.getBalance(
									accounts[0].address,
								);

								const endingTimeStamp = await lottery.getLatestTimeStamp();

								await expect(lottery.getPlayer(0)).to.be.reverted;
								assert.equal(recentWinner.toString(), accounts[0].address);
								assert.equal(Number(lotteryState), 0);
								assert.equal(
									Number(winnerEndBalance),
									Number(winnerStartBalance) + Number(ticketPrice),
								);

								assert(endingTimeStamp > startingTimestamp);
								resolve();
							} catch (error) {
								reject(error);
							}
						});

						// 1. Sets up listener (promise above)
						// 2. Enters lottery
						// 3. waits for promise to resolve or reject
						console.log("Entering Lottery...");
						const tx = await lottery.enterLottery({ value: ticketPrice });
						await tx.wait(1);
						console.log("Ok, time to wait...");
						const winnerStartBalance = await ethers.provider.getBalance(
							accounts[0].address,
						);
					});
				});
			});
	  });
