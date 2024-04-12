// eslint-disable-next-line @typescript-eslint/no-var-requires
import { EndpointId } from '@layerzerolabs/lz-definitions'

const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MyONFTMock',
}

// const fujiContract = {
//     eid: EndpointId.AVALANCHE_V2_TESTNET,
//     contractName: 'MyOFT',
// }

// const mumbaiContract = {
//     eid: EndpointId.POLYGON_V2_TESTNET,
//     contractName: 'MyOFT',
// }

const joctContract = {
    eid: EndpointId.JOC_V2_TESTNET,
    contractName: 'MyONFTMock',
}

export default {
    contracts: [
        // {
        //     contract: fujiContract,
        // },
        {
            contract: sepoliaContract,
        },
        // {
        //     contract: mumbaiContract,
        // },
        {
            contract: joctContract,
        },
    ],
    connections: [
        // {
        //     from: fujiContract,
        //     to: sepoliaContract,
        //     config: {},
        // },
        // {
        //     from: fujiContract,
        //     to: mumbaiContract,
        // },
        // {
        //     from: sepoliaContract,
        //     to: fujiContract,
        // },
        // {
        //     from: sepoliaContract,
        //     to: mumbaiContract,
        // },
        // {
        //     from: mumbaiContract,
        //     to: sepoliaContract,
        // },
        // {
        //     from: mumbaiContract,
        //     to: fujiContract,
        // },
        {
            from: joctContract,
            to: sepoliaContract,
        },
        {
            from: sepoliaContract,
            to: joctContract,
        },
    ],
}
