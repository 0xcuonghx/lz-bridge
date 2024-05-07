// eslint-disable-next-line @typescript-eslint/no-var-requires
import { EndpointId } from '@layerzerolabs/lz-definitions'

// const sepoliaContract = {
//     eid: EndpointId.SEPOLIA_V2_TESTNET,
//     contractName: 'MyOFTMock',
// }

const joctContract = {
    eid: EndpointId.JOC_V2_TESTNET,
    contractName: 'MyOFTMock',
}

const arbsepContract = {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    contractName: 'MyOFTMock',
}

export default {
    contracts: [
        {
            contract: joctContract,
        },
        {
            contract: arbsepContract,
        },
    ],
    connections: [
        {
            from: arbsepContract,
            to: joctContract,
        },
        {
            from: joctContract,
            to: arbsepContract,
        },
    ],
}
