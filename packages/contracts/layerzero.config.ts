// eslint-disable-next-line @typescript-eslint/no-var-requires
import { EndpointId } from '@layerzerolabs/lz-definitions'

const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'FixedRate',
}

const joctContract = {
    eid: EndpointId.JOC_V2_TESTNET,
    contractName: 'FixedRate',
}

const arbsepContract = {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    contractName: 'FixedRate',
}

export default {
    contracts: [
        {
            contract: sepoliaContract,
        },

        {
            contract: joctContract,
        },
        {
            contract: arbsepContract,
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
        {
            from: arbsepContract,
            to: sepoliaContract,
        },
        {
            from: sepoliaContract,
            to: arbsepContract,
        },
    ],
}
