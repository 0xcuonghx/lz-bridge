import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect, use } from 'chai'
import chaiAsPromise from 'chai-as-promised'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

use(chaiAsPromise)

describe.only('FixedRate Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    // Declaration of variables to be used in the test suite
    let FixedRate: ContractFactory
    let EndpointV2Mock: ContractFactory
    let oAppOwner: SignerWithAddress
    let alice: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let myFixedRateA: Contract
    let myFixedRateB: Contract
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        //
        // We are using a derived contract that exposes a mint() function for testing purposes
        FixedRate = await ethers.getContractFactory('FixedRate')

        // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
        const signers = await ethers.getSigners()

        oAppOwner = signers.at(0)!
        alice = signers.at(1)!
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
        myFixedRateA = await FixedRate.deploy(mockEndpointV2A.address, oAppOwner.address)
        myFixedRateB = await FixedRate.deploy(mockEndpointV2B.address, oAppOwner.address)

        // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
        await mockEndpointV2A.setDestLzEndpoint(myFixedRateB.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(myFixedRateA.address, mockEndpointV2A.address)

        // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
        await myFixedRateA.connect(oAppOwner).setPeer(eidB, ethers.utils.zeroPad(myFixedRateB.address, 32))
        await myFixedRateB.connect(oAppOwner).setPeer(eidA, ethers.utils.zeroPad(myFixedRateA.address, 32))

        // Setting rate
        await myFixedRateA.connect(oAppOwner).setRate(eidB, 1, 5)
        await myFixedRateB.connect(oAppOwner).setRate(eidA, 5, 1)

        // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
    })

    // A test case to verify token transfer functionality
    it('should send a token from A address to B address via each OFT using default', async function () {
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(ethers.utils.parseEther('0'))

        // ensure they're both allocated initial amounts
        expect(await ethers.provider.getBalance(myFixedRateA.address)).to.eql(ethers.utils.parseEther('0'))

        const depositAmount = ethers.utils.parseEther('100')
        await myFixedRateB.deposit({ value: depositAmount })

        expect(await ethers.provider.getBalance(myFixedRateB.address)).to.be.eql(depositAmount)

        const sendAmount = ethers.utils.parseEther('10')

        const aliceBalanceBefore = ethers.utils.formatEther(await ethers.provider.getBalance(alice.address))

        // Defining extra message execution options for the send operation
        // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [eidB, ethers.utils.zeroPad(alice.address, 32), sendAmount, options]

        // Fetching the native fee for the token send operation
        const [nativeFee] = await myFixedRateA.quote(sendParam, false)

        // Executing the send operation from myFixedRateA contract
        await myFixedRateA.connect(alice).send(sendParam, [nativeFee, 0], alice.address, {
            value: nativeFee.add(sendAmount),
        })

        const aliceBalanceAfter = ethers.utils.formatEther(await ethers.provider.getBalance(alice.address))

        expect(await ethers.provider.getBalance(myFixedRateA.address)).to.be.eql(sendAmount)
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(nativeFee) // collects
        // expect(await ethers.provider.getBalance(myFixedRateB.address)).to.be.eql(sendAmount)
        console.log(await ethers.provider.getBalance(myFixedRateB.address))

        console.log({
            aliceBalanceBefore,
            aliceBalanceAfter,
        })
    })
})
