
module.exports = {
    PlutusCfg:{
        "collateralAmount": 123450000,  
        "testnetPrefix": 'addr_test', 
        "mainnetPrefix": 'addr',
        "maxUtxoNum": 2,
        "leaderUtxoNumLimit": 3,
        "maxCollacteralUtxosNum": 3
    },
    ErrorDef:{        
        "ErrorCode_NetworkException": 404,
        "ErrorCode_TxSubmitFailed": 405,
        "ErrorCode_TreasuryInsufficent": 406,
        "ErrorCode_InSufficentUtxoForFee": 407,
        "ErrorCode_InSufficentTreasuryUtxo": 408,
        "ErrorCode_InSufficentGroupInfoToken": 409,
        "ErrorCode_InvalidParams": 410,
        "ErrorCode_EmptyScriptRefUtxo": 411,
        "ErrorCode_EmptyCheckRefUtxo":412,
        "ErrorCode_EmptyCheckUtxo":413,
        "ErrorCode_InvalidPaymentSkey": 414
    },
    AdaTokenId: "0x0000000000000000000000000000000000000000",
    SignAlgorithmMode: 0,
    MaxConsumedUtxoTTL: 630,
    MaxConsumedCheckUtxoTTL: 1500,
    MaxTxTTL: 600,
    MaxNftUtxoOccupiedTs: 1200,
    SafeBlockHeight: 30,
    SecurityBlockSlots: 600,
    SecurityBlocksForCoinSelection: 5,
    UtxoValidLatestSlot: 15,
    ChainStatusValidLatestSlot: 40,
    PriorityFactor: 5,
    BalancedCfg: {
        "maxUtxoListLen": 30,
        "idealUtxoListLen": 20,
        "minUtxoListLen": 10,
        "balancedType_Merge": 0,
        "balancedType_Split": 1,
        "mergePolicy_Asc": 0,
        "mergePolicy_Desc": 1,
        "minSpitedUtxoNum": 2,
        "defaultBalancedOutputNum": 1,
        "maxForcedBalancedSlot": 600,
        "maxPendingUtxoRatio": 75,
        "configValidLatestSlot": 3600
    },
    CompareResult:{
        "lt": -1,
        "eq": 0,
        "mt": 1
    },
    TaskType:{
        "crossTask": 0,
        "balancedTask": 1,
        "manualTask": 2
    }
}
