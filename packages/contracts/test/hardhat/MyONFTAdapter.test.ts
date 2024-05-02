import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

describe('MyOFTAdapter Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    const eidC = 3
    // Declaration of variables to be used in the test suite
    let MyONFTAdapter: ContractFactory
    let MyONFT: ContractFactory
    let ERC721: ContractFactory
    let EndpointV2Mock: ContractFactory
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let myONFTA: Contract
    let myONFTB: Contract
    let myONFTC: Contract
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract
    let mockEndpointV2C: Contract
    let erc721: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        //
        // We are using a derived contract that exposes a mint() function for testing purposes
        MyONFT = await ethers.getContractFactory('MyONFTMock')
        MyONFTAdapter = await ethers.getContractFactory('MyONFTAdapterMock')
        ERC721 = await ethers.getContractFactory('ERC721Mock')

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
        // Deploying a erc20
        erc721 = await ERC721.deploy('ERC721', 'ERC721')

        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpointV2A = await EndpointV2Mock.deploy(eidA)
        mockEndpointV2B = await EndpointV2Mock.deploy(eidB)
        mockEndpointV2C = await EndpointV2Mock.deploy(eidC)

        // Deploying two instances of MyOFT contract with different identifiers and linking them to the mock LZEndpoint
        myONFTA = await MyONFTAdapter.deploy(erc721.address, mockEndpointV2A.address, ownerA.address)
        myONFTB = await MyONFT.deploy('bONFT', 'bONFT', mockEndpointV2B.address, ownerB.address)
        myONFTC = await MyONFT.deploy('cONFT', 'cONFT', mockEndpointV2C.address, ownerB.address)

        // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
        await mockEndpointV2A.setDestLzEndpoint(myONFTB.address, mockEndpointV2B.address)
        await mockEndpointV2A.setDestLzEndpoint(myONFTC.address, mockEndpointV2C.address)
        await mockEndpointV2B.setDestLzEndpoint(myONFTA.address, mockEndpointV2A.address)
        await mockEndpointV2B.setDestLzEndpoint(myONFTC.address, mockEndpointV2C.address)
        await mockEndpointV2C.setDestLzEndpoint(myONFTA.address, mockEndpointV2A.address)
        await mockEndpointV2C.setDestLzEndpoint(myONFTB.address, mockEndpointV2B.address)

        // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
        await myONFTA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(myONFTB.address, 32))
        await myONFTA.connect(ownerA).setPeer(eidC, ethers.utils.zeroPad(myONFTC.address, 32))
        await myONFTB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(myONFTA.address, 32))
        await myONFTB.connect(ownerB).setPeer(eidC, ethers.utils.zeroPad(myONFTC.address, 32))
        await myONFTC.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(myONFTA.address, 32))
        await myONFTC.connect(ownerB).setPeer(eidB, ethers.utils.zeroPad(myONFTB.address, 32))
    })

    // A test case to verify token transfer functionality
    it('should send a token from A address to B address via each ONFTAdapter', async function () {
        // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
        const tokenId = 123
        await erc721.safeMint(ownerA.address, tokenId)

        // verify the owner of the token is on the source chain
        expect(await erc721.ownerOf(tokenId)).to.be.equal(ownerA.address)
        // token doesn't exist on other chain
        await expect(myONFTB.ownerOf(tokenId)).to.be.rejectedWith('ERC721NonexistentToken')

        // can transfer token on srcChain as regular erC721
        await erc721.connect(ownerA).transferFrom(ownerA.address, ownerB.address, tokenId)
        expect(await erc721.ownerOf(tokenId)).to.be.equal(ownerB.address)

        // approve the proxy to swap your token
        await erc721.connect(ownerB).approve(myONFTA.address, tokenId)

        // Defining the amount of tokens to send and constructing the parameters

        // Defining extra message execution options for the send operation
        // @dev: The amount of gas you'd provide for the lzReceive call in source chain native tokens. 200000 should be enough for most transactions.
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        let sendParam = [eidB, ethers.utils.zeroPad(ownerB.address, 32), tokenId, options, '0x', '0x']

        // Fetching the native fee for the token send operation
        const [nativeFee] = await myONFTA.quoteSend(sendParam, false)

        // Executing the send operation from myOFTA contract
        await myONFTA.connect(ownerB).send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee })

        // token is now owned by the proxy contract, because this is the original nft chain
        expect(await erc721.ownerOf(tokenId)).to.equal(myONFTA.address)
        // token received on the dst chain
        // Fetching the native fee for the token send operation
        expect(await myONFTB.ownerOf(tokenId)).to.be.equal(ownerB.address)

        // can send to other onft contract eg. not the original nft contract chain
        sendParam = [eidC, ethers.utils.zeroPad(ownerB.address, 32), tokenId, options, '0x', '0x']
        const [nativeFee2] = await myONFTB.quoteSend(sendParam, false)

        await myONFTB.connect(ownerB).send(sendParam, [nativeFee2, 0], ownerA.address, { value: nativeFee2 })

        // token is burned on the sending chain
        await expect(myONFTB.ownerOf(tokenId)).rejectedWith('ERC721NonexistentToken')

        // token received on the dst chain
        expect(await myONFTC.ownerOf(tokenId)).to.be.equal(ownerB.address)

        // send it back to the original chain
        sendParam = [eidA, ethers.utils.zeroPad(ownerB.address, 32), tokenId, options, '0x', '0x']
        const [nativeFee3] = await myONFTC.quoteSend(sendParam, false)

        await myONFTC.connect(ownerB).send(sendParam, [nativeFee3, 0], ownerA.address, { value: nativeFee3 })

        // token is burned on the sending chain
        await expect(myONFTC.ownerOf(tokenId)).rejectedWith('ERC721NonexistentToken')

        // is received on the original chain
        expect(await erc721.ownerOf(tokenId)).to.be.equal(ownerB.address)
    })
})
