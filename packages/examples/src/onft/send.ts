import { ethers } from "ethers";
import assert from "assert";

import OnftAbi from "../abis/ONFT.json";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import "dotenv/config";

async function main() {
  let tx;
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
  const eidB = process.env.ENDPOINT_ID_B;
  const rpcB = new ethers.JsonRpcProvider(process.env.RPC_B);
  const ownerB = new ethers.Wallet(process.env.PRIVATE_KEY, rpcB);
  assert(process.env.ONFT_B_ADDRESS, "Missing ONFT_B_ADDRESS");
  const myONFTB = new ethers.Contract(
    process.env.ONFT_B_ADDRESS,
    OnftAbi,
    ownerB
  );

  // Step up
  // const tokenIdToSend = 1;
  // tx = await myONFTA.mint(ownerA.address, initialTokenId);
  // tx.wait();

  console.log("owner A: ", ownerA.address);
  console.log("owner B: ", ownerB.address);

  console.log(
    "Balance before send at A: ",
    await myONFTA.balanceOf(ownerA.address)
  );
  console.log(
    "Balance before send at B: ",
    await myONFTB.balanceOf(ownerA.address)
  );

  // Defining the amount of tokens to send and constructing the parameters for the send operation
  const tokenIdToSend = 1;

  // Defining extra message execution options for the send operation
  // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
  const options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 0)
    .toHex()
    .toString();

  const sendParam = [
    eidB,
    ethers.zeroPadValue(ownerB.address, 32),
    tokenIdToSend,
    options,
  ];

  // Fetching the native fee for the token send operation
  const [nativeFee] = await myONFTA.quoteSend(sendParam, false);

  // Executing the send operation from myOFTA contract
  tx = await myONFTA.send(sendParam, [nativeFee, 0], ownerA.address, {
    value: nativeFee,
  });
  tx.wait();
}

main();
