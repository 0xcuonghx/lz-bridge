import { ethers } from "ethers";
import assert from "assert";

import OnftAbi from "../abis/ONFT.json";
import "dotenv/config";

async function main() {
  assert(process.env.PRIVATE_KEY, "Missing PRIVATE_KEY");

  // A
  const rpcA = new ethers.JsonRpcProvider(process.env.RPC_A);
  const ownerA = new ethers.Wallet(process.env.PRIVATE_KEY, rpcA);
  assert(process.env.ONFT_A_ADDRESS, "Missing ONFT_A_ADDRESS");
  const myONFTA = new ethers.Contract(
    process.env.ONFT_A_ADDRESS,
    OnftAbi,
    ownerA
  );

  // B
  const rpcB = new ethers.JsonRpcProvider(process.env.RPC_B);
  const ownerB = new ethers.Wallet(process.env.PRIVATE_KEY, rpcB);
  assert(process.env.ONFT_B_ADDRESS, "Missing ONFT_B_ADDRESS");
  const myONFTB = new ethers.Contract(
    process.env.ONFT_B_ADDRESS,
    OnftAbi,
    ownerB
  );

  console.log(
    "Balance before send at A: ",
    await myONFTA.balanceOf(ownerA.address)
  );
  console.log(
    "Balance before send at B: ",
    await myONFTB.balanceOf(ownerB.address)
  );
}

main();
