import { ethers, formatEther } from "ethers";
import assert from "assert";
import FixedRateAbi from "../abis/FixedRate.json";
import { Options } from "@layerzerolabs/lz-v2-utilities";

import "dotenv/config";

async function main() {
  let tx;
  assert(process.env.PLAYER_PRIVATE_KEY, "Missing PLAYER_PRIVATE_KEY");

  // A
  const eidA = process.env.ENDPOINT_ID_A;
  const rpcA = new ethers.JsonRpcProvider(process.env.RPC_A);
  const playerA = new ethers.Wallet(process.env.PLAYER_PRIVATE_KEY, rpcA);
  assert(process.env.FIXED_RATE_A_ADDRESS, "Missing FIXED_RATE_A_ADDRESS");
  const myFixedRateA = new ethers.Contract(
    process.env.FIXED_RATE_A_ADDRESS,
    FixedRateAbi,
    playerA
  );

  // B
  const eidB = process.env.ENDPOINT_ID_B;
  const rpcB = new ethers.JsonRpcProvider(process.env.RPC_B);
  const playerB = new ethers.Wallet(process.env.PLAYER_PRIVATE_KEY, rpcB);
  assert(process.env.FIXED_RATE_B_ADDRESS, "Missing FIXED_RATE_B_ADDRESS");
  const myFixedRateB = new ethers.Contract(
    process.env.FIXED_RATE_B_ADDRESS,
    FixedRateAbi,
    playerB
  );

  console.log(
    "myFixedRateA",
    await rpcA.getBalance(await myFixedRateA.getAddress())
  );
  console.log(
    "myFixedRateB",
    await rpcB.getBalance(await myFixedRateB.getAddress())
  );
  console.log("playerA", formatEther(await rpcA.getBalance(playerA.address)));
  console.log("playerB", formatEther(await rpcB.getBalance(playerB.address)));

  const tokensToSend = ethers.parseEther("0.001");
  console.log("Balance send from JOC to ETH: ", formatEther(tokensToSend));

  // Defining extra message execution options for the send operation
  // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
  const options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 0)
    .toHex()
    .toString();

  const sendParam = [
    eidB,
    ethers.zeroPadValue(playerB.address, 32),
    tokensToSend,
    options,
  ];

  // Fetching the native fee for the token send operation
  const [nativeFee] = await myFixedRateA.quote(sendParam, false);
  console.log("Fee", formatEther(nativeFee));

  // Executing the send operation from myOFTA contract
  tx = await myFixedRateA.send(sendParam, [nativeFee, 0], playerA.address, {
    value: nativeFee + tokensToSend,
  });
  tx.wait();
  console.log("Done!");
}

main();
