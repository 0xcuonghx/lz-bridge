import { ethers, formatEther } from "ethers";
import assert from "assert";
import FixedRateAbi from "../abis/FixedRate.json";
import { Options } from "@layerzerolabs/lz-v2-utilities";

import "dotenv/config";

async function main() {
  let tx;
  assert(process.env.OWNER_PRIVATE_KEY, "Missing OWNER_PRIVATE_KEY");

  // A
  const eidA = process.env.ENDPOINT_ID_A;
  const rpcA = new ethers.JsonRpcProvider(process.env.RPC_A);
  const playerA = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, rpcA);
  assert(process.env.FIXED_RATE_A_ADDRESS, "Missing FIXED_RATE_A_ADDRESS");
  const myFixedRateA = new ethers.Contract(
    process.env.FIXED_RATE_A_ADDRESS,
    FixedRateAbi,
    playerA
  );

  // B
  const eidB = process.env.ENDPOINT_ID_B;
  const rpcB = new ethers.JsonRpcProvider(process.env.RPC_B);
  const playerB = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, rpcB);
  assert(process.env.FIXED_RATE_B_ADDRESS, "Missing FIXED_RATE_B_ADDRESS");
  const myFixedRateB = new ethers.Contract(
    process.env.FIXED_RATE_B_ADDRESS,
    FixedRateAbi,
    playerB
  );

  tx = await myFixedRateA.withdraw(
    await rpcA.getBalance(await myFixedRateA.getAddress())
  );

  await tx.wait();

  tx = await myFixedRateB.withdraw(
    await rpcB.getBalance(await myFixedRateB.getAddress())
  );

  await tx.wait();

  console.log(
    "myFixedRateA",
    formatEther(await rpcA.getBalance(await myFixedRateA.getAddress()))
  );
  console.log(
    "myFixedRateB",
    formatEther(await rpcB.getBalance(await myFixedRateB.getAddress()))
  );

  console.log("playerA", formatEther(await rpcA.getBalance(playerA.address)));
  console.log("playerB", formatEther(await rpcB.getBalance(playerB.address)));
}

main();
