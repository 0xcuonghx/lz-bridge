import { ethers } from "ethers";
import assert from "assert";

import OftAbi from "../abis/OFT.json";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import "dotenv/config";

async function main() {
  let tx;
  assert(process.env.PRIVATE_KEY, "Missing PRIVATE_KEY");

  // A
  const rpcA = new ethers.JsonRpcProvider(process.env.RPC_A);
  const ownerA = new ethers.Wallet(process.env.PRIVATE_KEY, rpcA);
  assert(process.env.OFT_A_ADDRESS, "Missing OFT_A_ADDRESS");
  const myOFTA = new ethers.Contract(process.env.OFT_A_ADDRESS, OftAbi, ownerA);

  // B
  const eidB = process.env.ENDPOINT_ID_B;
  const rpcB = new ethers.JsonRpcProvider(process.env.RPC_B);
  const ownerB = new ethers.Wallet(process.env.PRIVATE_KEY, rpcB);
  assert(process.env.OFT_B_ADDRESS, "Missing OFT_B_ADDRESS");
  const myOFTB = new ethers.Contract(process.env.OFT_B_ADDRESS, OftAbi, ownerB);

  // Step up
  const initialAmount = ethers.parseEther("100");
  tx = await myOFTA.mint(ownerA.address, initialAmount);
  tx.wait();

  // tx = await myOFTB.mint(ownerB.address, initialAmount);
  // tx.wait();

  console.log("Balance at A: ", await myOFTA.balanceOf(ownerA.address));
  console.log("Balance at B: ", await myOFTB.balanceOf(ownerB.address));

  console.log("Done!");
}

main();
