import { ethers } from "ethers";
import assert from "assert";

import OftAbi from "../abis/OFT.json";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import "dotenv/config";

async function main() {
  let tx;
  assert(process.env.PRIVATE_KEY, "Missing PRIVATE_KEY");

  // A
  const eidA = process.env.ENDPOINT_ID_A;
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

  console.log("owner A: ", ownerA.address);
  console.log("owner B: ", ownerB.address);

  console.log(
    "Balance before send at A: ",
    await myOFTA.balanceOf(ownerA.address)
  );
  console.log(
    "Balance before send at B: ",
    await myOFTB.balanceOf(ownerA.address)
  );

  // Defining the amount of tokens to send and constructing the parameters for the send operation
  const tokensToSend = ethers.parseEther("1");
  console.log("Balance send B to A: ", tokensToSend.toString());

  // Defining extra message execution options for the send operation
  // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
  const options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 0)
    .toHex()
    .toString();

  const sendParam = [
    eidA,
    ethers.zeroPadValue(ownerB.address, 32),
    tokensToSend,
    tokensToSend,
    options,
    "0x",
    "0x",
  ];

  // Fetching the native fee for the token send operation
  const [nativeFee] = await myOFTB.quoteSend(sendParam, false);

  // Executing the send operation from myOFTA contract
  tx = await myOFTB.send(sendParam, [nativeFee, 0], ownerA.address, {
    value: nativeFee,
  });
  tx.wait();
}

main();
