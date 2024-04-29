import { ethers } from "ethers";
import assert from "assert";

import OftAbi from "../abis/OFT.json";
import "dotenv/config";

async function main() {
  assert(process.env.PRIVATE_KEY, "Missing PRIVATE_KEY");

  // A
  const rpcA = new ethers.JsonRpcProvider(process.env.RPC_A);
  const ownerA = new ethers.Wallet(process.env.PRIVATE_KEY, rpcA);
  assert(process.env.OFT_A_ADDRESS, "Missing OFT_A_ADDRESS");
  const myOFTA = new ethers.Contract(process.env.OFT_A_ADDRESS, OftAbi, ownerA);

  // B
  const rpcB = new ethers.JsonRpcProvider(process.env.RPC_B);
  const ownerB = new ethers.Wallet(process.env.PRIVATE_KEY, rpcB);
  assert(process.env.OFT_B_ADDRESS, "Missing OFT_B_ADDRESS");
  const myOFTB = new ethers.Contract(process.env.OFT_B_ADDRESS, OftAbi, ownerB);

  console.log(
    "Balance before send at A: ",
    await myOFTA.balanceOf(ownerA.address)
  );
  console.log(
    "Balance before send at B: ",
    await myOFTB.balanceOf(ownerB.address)
  );
}

main();
