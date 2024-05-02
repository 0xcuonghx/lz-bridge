import { ethers } from "ethers";
import assert from "assert";
import FixedRateAbi from "../abis/FixedRate.json";

import "dotenv/config";

async function main() {
  let tx;
  assert(process.env.OWNER_PRIVATE_KEY, "Missing OWNER_PRIVATE_KEY");

  // A
  const eidA = process.env.ENDPOINT_ID_A;
  const rpcA = new ethers.JsonRpcProvider(process.env.RPC_A);
  const ownerA = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, rpcA);
  assert(process.env.FIXED_RATE_A_ADDRESS, "Missing FIXED_RATE_A_ADDRESS");
  const myFixedRateA = new ethers.Contract(
    process.env.FIXED_RATE_A_ADDRESS,
    FixedRateAbi,
    ownerA
  );

  // B
  const eidB = process.env.ENDPOINT_ID_B;
  const rpcB = new ethers.JsonRpcProvider(process.env.RPC_B);
  const ownerB = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, rpcB);
  assert(process.env.FIXED_RATE_B_ADDRESS, "Missing FIXED_RATE_B_ADDRESS");
  const myFixedRateB = new ethers.Contract(
    process.env.FIXED_RATE_B_ADDRESS,
    FixedRateAbi,
    ownerB
  );

  // 1. Config rate
  tx = await myFixedRateA.setRate(eidB, 5, 1);
  await tx.wait();
  tx = await myFixedRateB.setRate(eidA, 1, 5);
  await tx.wait();

  // 2. Deposit token
  tx = await myFixedRateA.deposit({ value: ethers.parseEther("0.1") });
  await tx.wait();

  console.log(
    "myFixedRateA",
    await rpcA.getBalance(await myFixedRateA.getAddress())
  );
  console.log(
    "myFixedRateB",
    await rpcB.getBalance(await myFixedRateB.getAddress())
  );
}

main();
