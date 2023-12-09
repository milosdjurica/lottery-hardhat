import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

import "hardhat-deploy";
import "hardhat-deploy-ethers";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_PROCESS_ENV || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xKEY";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "api-key";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "api-key";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
};

export default config;
