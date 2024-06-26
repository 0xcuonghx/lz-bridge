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
        {
            contract: joctContract,
        },
        {
            contract: arbsepContract,
        },
        {
            contract: jocContract,
        },
        {
            contract: polygonContract,
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
        {
            from: jocContract,
            to: polygonContract,
            config: {
                sendLibrary: '0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043',
                receiveLibraryConfig: {
                    receiveLibrary: '0x2367325334447C5E1E0f1b3a6fB947b262F58312',
                    gracePeriod: BigInt(0),
                },
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 10000,
                        executor: '0xcCE466a522984415bC91338c232d98869193D46e',
                    },
                    ulnConfig: {
                        requiredDVNs: ['0x9c061c9a4782294eef65ef28cb88233a987f4bdd'],
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        requiredDVNs: ['0x9c061c9a4782294eef65ef28cb88233a987f4bdd'],
                    },
                },
            },
        },
        {
            from: polygonContract,
            to: jocContract,
            config: {
                sendLibrary: '0x6c26c61a97006888ea9E4FA36584c7df57Cd9dA3',
                receiveLibraryConfig: {
                    receiveLibrary: '0x1322871e4ab09Bc7f5717189434f97bBD9546e95',
                    gracePeriod: BigInt(0),
                },
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 10000,
                        executor: '0xCd3F213AD101472e1713C72B1697E727C803885b',
                    },
                    ulnConfig: {
                        requiredDVNs: ['0x23de2fe932d9043291f870324b74f820e11dc81a'],
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        requiredDVNs: ['0x23de2fe932d9043291f870324b74f820e11dc81a'],
                    },
                },
            },
        },
    ],
}
