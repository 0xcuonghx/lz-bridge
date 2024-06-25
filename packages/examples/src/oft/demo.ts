import { ethers } from "ethers";
import assert from "assert";

import OftAbi from "../abis/OFT.json";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import "dotenv/config";

async function main() {
  let tx;
  assert(process.env.PRIVATE_KEY, "Missing PRIVATE_KEY");

  // A
  const rpcA = new ethers.JsonRpcProvider(
    "https://rpc-1.japanopenchain.org:8545"
  );
  const ownerA = new ethers.Wallet(process.env.PRIVATE_KEY, rpcA);
  const myOFTA = new ethers.Contract(
    "0x421B2394636324C24cf7540621B4be5eDACFC82F",
    OftAbi,
    ownerA
  );

  // B
  const eidB = "30109";
  const rpcB = new ethers.JsonRpcProvider("https://polygon.rpc.blxrbdn.com");
  const ownerB = new ethers.Wallet(process.env.PRIVATE_KEY, rpcB);

  const tokensToSend = ethers.parseEther("1");
  console.log("Balance send A to B: ", tokensToSend.toString());

  const options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 0)
    .toHex()
    .toString();

  const sendParam = [
    eidB,
    ethers.zeroPadValue(ownerB.address, 32),
    tokensToSend,
    tokensToSend,
    options,
    "0x",
    "0x",
  ];

  // Fetching the native fee for the token send operation
  const [nativeFee] = await myOFTA.quoteSend(sendParam, false);
  // Executing the send operation from myOFTA contract
  tx = await myOFTA.send(sendParam, [nativeFee, 0], ownerA.address, {
    value: nativeFee,
  });
  tx.wait();
}

main();
