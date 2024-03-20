import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect, use } from 'chai'
import chaiAsPromise from 'chai-as-promised'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

use(chaiAsPromise)

describe('MyNativeOFT Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    // Declaration of variables to be used in the test suite
    let MyOFT: ContractFactory
    let MyNativeOFT: ContractFactory
    let EndpointV2Mock: ContractFactory
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let myOFTA: Contract
    let myOFTB: Contract
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        //
        // We are using a derived contract that exposes a mint() function for testing purposes
        MyOFT = await ethers.getContractFactory('MyOFTMock')
        MyNativeOFT = await ethers.getContractFactory('MyNativeOFTMock')

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
        myOFTA = await MyNativeOFT.deploy('aOFT', 'aOFT', mockEndpointV2A.address, ownerA.address)
        myOFTB = await MyOFT.deploy('bOFT', 'bOFT', mockEndpointV2B.address, ownerB.address)

        // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
        await mockEndpointV2A.setDestLzEndpoint(myOFTB.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(myOFTA.address, mockEndpointV2A.address)

        // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
        await myOFTA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(myOFTB.address, 32))
        await myOFTB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(myOFTA.address, 32))
    })

    // A test case to verify token transfer functionality
    it('should send a token from A address to B address via each OFT using default', async function () {
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(ethers.utils.parseEther('0'))

        // ensure they're both allocated initial amounts
        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))
        expect(await myOFTB.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))
        expect(await ethers.provider.getBalance(myOFTA.address)).to.eql(ethers.utils.parseEther('0'))

        const depositAmount = ethers.utils.parseEther('7')
        await myOFTA.deposit({ value: depositAmount })

        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(depositAmount)
        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(depositAmount)

        const leftOverAmount = ethers.utils.parseEther('0')
        const totalAmount = ethers.utils.parseEther('8')

        // Defining extra message execution options for the send operation
        // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [
            eidB,
            ethers.utils.zeroPad(ownerB.address, 32),
            totalAmount,
            totalAmount,
            options,
            '0x',
            '0x',
        ]

        // Fetching the native fee for the token send operation
        const [nativeFee] = await myOFTA.quoteSend(sendParam, false)

        // Executing the send operation from myOFTA contract
        await myOFTA.send(sendParam, [nativeFee, 0], ownerA.address, {
            value: nativeFee.add(totalAmount.sub(depositAmount)),
        })
        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(totalAmount)
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(nativeFee) // collects
        expect(await myOFTA.balanceOf(myOFTA.address)).to.be.eql(totalAmount)
        expect(await myOFTA.balanceOf(ownerA.address)).to.be.eql(leftOverAmount)
        expect(await myOFTB.balanceOf(ownerB.address)).to.be.eql(totalAmount)
        expect(await myOFTB.totalSupply()).to.be.eql(totalAmount)
    })

    it('should send a token from A address to B address via each OFT with enough native', async function () {
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(ethers.utils.parseEther('0'))

        // ensure they're both allocated initial amounts
        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))
        expect(await myOFTB.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))
        expect(await ethers.provider.getBalance(myOFTA.address)).to.eql(ethers.utils.parseEther('0'))

        const depositAmount = ethers.utils.parseEther('4.000000000000000001')
        await myOFTA.deposit({ value: depositAmount })

        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(depositAmount)
        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(depositAmount)

        const leftOverAmount = ethers.utils.parseEther('0.000000000000000001')
        const totalAmount = ethers.utils.parseEther('4.000000000000000001')
        const totalAmountMinusDust = ethers.utils.parseEther('4')

        // Defining extra message execution options for the send operation
        // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [
            eidB,
            ethers.utils.zeroPad(ownerB.address, 32),
            totalAmount,
            totalAmountMinusDust,
            options,
            '0x',
            '0x',
        ]

        // Fetching the native fee for the token send operation
        const [nativeFee] = await myOFTA.quoteSend(sendParam, false)

        // Executing the send operation from myOFTA contract
        await myOFTA.send(sendParam, [nativeFee, 0], ownerA.address, {
            value: nativeFee.add(totalAmount.sub(depositAmount)),
        })
        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(totalAmount)
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(nativeFee) // collects
        expect(await ethers.provider.getBalance(mockEndpointV2B.address)).to.be.eql(ethers.utils.parseEther('0'))
        expect(await myOFTA.balanceOf(myOFTA.address)).to.be.eql(totalAmountMinusDust)
        expect(await myOFTA.balanceOf(ownerA.address)).to.be.eql(leftOverAmount)
        expect(await myOFTB.balanceOf(ownerB.address)).to.be.eql(totalAmountMinusDust)
        expect(await myOFTB.totalSupply()).to.be.eql(totalAmountMinusDust)
    })

    it('should send a token from A address to B address via each OFT with insufficient value and expect revert', async function () {
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(ethers.utils.parseEther('0'))

        // ensure they're both allocated initial amounts
        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))
        expect(await myOFTB.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))
        expect(await ethers.provider.getBalance(myOFTA.address)).to.eql(ethers.utils.parseEther('0'))

        const depositAmount = ethers.utils.parseEther('4')
        await myOFTA.deposit({ value: depositAmount })

        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(depositAmount)
        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(depositAmount)

        const totalAmount = ethers.utils.parseEther('8')
        const messageFee = ethers.utils.parseEther('3')
        // Defining extra message execution options for the send operation
        // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [
            eidB,
            ethers.utils.zeroPad(ownerB.address, 32),
            totalAmount,
            totalAmount,
            options,
            '0x',
            '0x',
        ]

        // Fetching the native fee for the token send operation
        const [nativeFee] = await myOFTA.quoteSend(sendParam, false)

        await expect(
            myOFTA.send(sendParam, [nativeFee, 0], ownerA.address, {
                value: messageFee,
            })
        ).to.be.rejectedWith('NativeOFT: Insufficient msg.value')
    })

    it('wrap() and unwrap()', async function () {
        const ownerBalance = await ethers.provider.getBalance(ownerA.address)
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(ethers.utils.parseEther('0'))
        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))

        const amount = ethers.utils.parseEther('100.000000000000000001')
        await myOFTA.deposit({ value: amount })

        let transFee = ownerBalance.sub(await ethers.provider.getBalance(ownerA.address)).sub(amount)

        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(amount)
        expect(await ethers.provider.getBalance(ownerA.address)).to.be.eql(ownerBalance.sub(amount).sub(transFee))
        expect(await myOFTA.balanceOf(ownerA.address)).to.be.eql(amount)

        await myOFTA.withdraw(amount)
        transFee = ownerBalance.sub(await ethers.provider.getBalance(ownerA.address))

        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(ethers.utils.parseEther('0'))
        expect(await ethers.provider.getBalance(ownerA.address)).to.be.eql(ownerBalance.sub(transFee))
        expect(await myOFTA.balanceOf(ownerA.address)).to.be.eql(ethers.utils.parseEther('0'))
    })

    it('wrap() and unwrap() expect revert', async function () {
        const ownerBalance = await ethers.provider.getBalance(ownerA.address)
        expect(await ethers.provider.getBalance(mockEndpointV2A.address)).to.be.eql(ethers.utils.parseEther('0'))
        expect(await myOFTA.balanceOf(ownerA.address)).to.eql(ethers.utils.parseEther('0'))

        let amount = ethers.utils.parseEther('100')
        await myOFTA.deposit({ value: amount })

        const transFee = ownerBalance.sub(await ethers.provider.getBalance(ownerA.address)).sub(amount)

        expect(await ethers.provider.getBalance(myOFTA.address)).to.be.eql(amount)
        expect(await ethers.provider.getBalance(ownerA.address)).to.be.eql(ownerBalance.sub(amount).sub(transFee))
        expect(await myOFTA.balanceOf(ownerA.address)).to.be.eql(amount)

        amount = ethers.utils.parseEther('150')
        await expect(myOFTA.withdraw(amount)).to.be.rejectedWith('NativeOFT: Insufficient balance.')
    })
})
