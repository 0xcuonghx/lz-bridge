// eslint-disable-next-line @typescript-eslint/no-var-requires
import { EndpointId } from '@layerzerolabs/lz-definitions'

const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MyOFT',
}

const joctContract = {
    eid: EndpointId.JOC_V2_TESTNET,
    contractName: 'MyNativeOFT',
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
