// eslint-disable-next-line @typescript-eslint/no-var-requires
import { EndpointId } from '@layerzerolabs/lz-definitions'

const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MyOFTMock',
}

const joctContract = {
    eid: EndpointId.JOC_V2_TESTNET,
    contractName: 'MyOFTMock',
}

export default {
    contracts: [
        {
            contract: sepoliaContract,
        },

        {
            contract: joctContract,
        },
    ],
    connections: [
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
