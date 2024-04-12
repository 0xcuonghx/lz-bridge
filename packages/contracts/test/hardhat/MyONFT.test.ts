import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

describe.only('MyONFT Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    // Declaration of variables to be used in the test suite
    let MyONFT: ContractFactory
    let EndpointV2Mock: ContractFactory
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let myONFTA: Contract
    let myONFTB: Contract
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        //
        // We are using a derived contract that exposes a mint() function for testing purposes
        MyONFT = await ethers.getContractFactory('MyONFTMock')

        // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
        const signers = await ethers.getSigners()

        ownerA = signers.at(0)!
        ownerB = signers.at(1)!
        endpointOwner = signers.at(2)!

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts
        // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
        //
        // See https://github.com/NomicFoundation/hardhat/issues/1040
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        EndpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpointV2A = await EndpointV2Mock.deploy(eidA)
        mockEndpointV2B = await EndpointV2Mock.deploy(eidB)

        // Deploying two instances of MyOFT contract with different identifiers and linking them to the mock LZEndpoint
        myONFTA = await MyONFT.deploy('aONFT', 'aONFT', mockEndpointV2A.address, ownerA.address)
        myONFTB = await MyONFT.deploy('bONFT', 'bONFT', mockEndpointV2B.address, ownerB.address)

        // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
        await mockEndpointV2A.setDestLzEndpoint(myONFTB.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(myONFTA.address, mockEndpointV2A.address)

        // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
        await myONFTA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(myONFTB.address, 32))
        await myONFTB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(myONFTA.address, 32))
    })

    // A test case to verify token transfer functionality
    it('should send a token from A address to B address via each ONFT', async function () {
        // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
        const initialTokenId = 1
        await myONFTA.mint(ownerA.address, initialTokenId)

        console.log(await myONFTA.balanceOf(ownerA.address))
        console.log(await myONFTB.balanceOf(ownerB.address))

        // Defining the amount of tokens to send and constructing the parameters

        // Defining extra message execution options for the send operation
        // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [eidB, ethers.utils.zeroPad(ownerB.address, 32), initialTokenId, options, '0x', '0x']

        // Fetching the native fee for the token send operation
        const [nativeFee] = await myONFTA.quoteSend(sendParam, false)

        // Executing the send operation from myOFTA contract
        await myONFTA.send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee })

        // Fetching the final token balances of ownerA and ownerB
        const finalBalanceA = await myONFTA.balanceOf(ownerA.address)
        const finalBalanceB = await myONFTB.balanceOf(ownerB.address)

        // Asserting that the final balances are as expected after the send operation
        expect(finalBalanceA.eq(0)).to.be.true
        expect(finalBalanceB.eq(1)).to.be.true
    })
})
