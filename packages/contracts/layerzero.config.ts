// eslint-disable-next-line @typescript-eslint/no-var-requires
import { EndpointId } from '@layerzerolabs/lz-definitions'

const joctContract = {
    eid: EndpointId.JOC_V2_TESTNET,
    contractName: 'MyOFTMock',
}

const arbsepContract = {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    contractName: 'MyOFTMock',
}

const jocContract = {
    eid: EndpointId.JOC_V2_MAINNET,
    contractName: 'MyOFTMock',
}

const polygonContract = {
    eid: EndpointId.POLYGON_V2_MAINNET,
    contractName: 'MyOFTMock',
}

export default {
    contracts: [
        // {
        //     contract: joctContract,
        // },
        // {
        //     contract: arbsepContract,
        // },
        {
            contract: jocContract,
        },
        {
            contract: polygonContract,
        },
    ],
    connections: [
        // {
        //     from: arbsepContract,
        //     to: joctContract,
        // },
        // {
        //     from: joctContract,
        //     to: arbsepContract,
        // },
        {
            from: jocContract,
            to: polygonContract,
        },
        {
            from: polygonContract,
            to: jocContract,
        },
    ],
}
