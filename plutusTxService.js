
const CoinSelection = require('./util/coinSelection');
// const CCTxBuilder = require('./plutusTxBuilder');
const CCTxBuilder = require('./plutusTxBuilderV2');
const NftCCTxBuilder = require('./plutusNftTxBuilder');
const UtxosManager = require('./utxosManager');


class PlutusTxService {

    constructor(chainConnector, scriptRefOwnerAddr, logger, bMainnet) {
        this.chainConnector = chainConnector;
        this.coinSelectionInst = new CoinSelection();
        this.scriptRefOwnerAddr = scriptRefOwnerAddr;
        this.logger = logger;
        this.bMainnet = bMainnet;
    }

    async init() {
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        this.utxosManagerObj = new UtxosManager(this.chainConnector,
            this.logger,
            this.bMainnet);
        let ret = await this.utxosManagerObj.init();
        if (false === ret) {
            return false;
        }

        /* Modify By NFT Program: 
            add nft tx builder object
        */
        this.nftCCTxBuilderObj = new NftCCTxBuilder(this.chainConnector,
            this.scriptRefOwnerAddr,
            this.utxosManagerObj,
            this.logger,
            this.bMainnet);
        await this.nftCCTxBuilderObj.init();

        // this.ccTxBuilderObj = new CCTxBuilder(this.chainConnector, 
        //     this.coinSelectionInst, 
        //     this.scriptRefOwnerAddr,
        //     logger, 
        //     bMainnet);
        // await this.ccTxBuilderObj.init();
        this.ccTxBuilderObj = new CCTxBuilder(this.chainConnector,
            this.scriptRefOwnerAddr,
            this.utxosManagerObj,
            this.logger,
            this.bMainnet);
        await this.ccTxBuilderObj.init();

        return true;
    }

    // to get cardano-side cross-chain locker address
    getLockerScAddress(bNftTask = false) {
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            return this.nftCCTxBuilderObj.getLockerScAddress();
        }

        return this.ccTxBuilderObj.getLockerScAddress();
    }

    // to get treasury group address
    getNFTRefHolderScript() {
        return this.nftCCTxBuilderObj.getNFTRefHolderScript();
    }

    // Part 1: cross-chain process
    // to build cross-chain tx
    async buildSignedTx(basicArgs, internalSignFunc, partialRedeemerArgs, bNftTask = false) {
        /* Modify By NFT Program: 
        need to add bNftCCTx? or add txType to justify?
        */
        if (bNftTask) {
            let ret = await this.nftCCTxBuilderObj.buildSignedTx(basicArgs, internalSignFunc, partialRedeemerArgs);
            return ret;
        }

        let ret = await this.ccTxBuilderObj.buildSignedTx(basicArgs, internalSignFunc, partialRedeemerArgs);
        return ret;
    }

    // to generate hash by redeem proof info
    genRedeemProofHash(proofInfo, bNftTask = false) {
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let ret = this.nftCCTxBuilderObj.genRedeemProofHash(proofInfo);
            return ret;
        }

        let ret = this.ccTxBuilderObj.genRedeemProofHash(proofInfo);
        return ret;
    }

    // to generate hash by token redeem proof info
    genTokenRedeemProofHash(proofInfo, bNftTask = false) {
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let ret = this.nftCCTxBuilderObj.genTokenRedeemProofHash(proofInfo);
            return ret;
        }

        let ret = this.ccTxBuilderObj.genTokenRedeemProofHash(proofInfo);
        return ret;
    }

    // Part 2: utxos balanced process
    // to mark asset type that needs balanced 
    markPendingBalancedAsset(address, assetUnit) {
        this.ccTxBuilderObj.markBalancedAsset(address, assetUnit);
        return;
    }

    // to build, sign and submit utxos-balanced tx 
    async tryUtxosBalanced(internalSignFunc, paymentInfo, address) {
        return await this.ccTxBuilderObj.tryUtxosBalanced(internalSignFunc, paymentInfo, address);
    }

    //  Part 3: manual process
    // to get&decode tx redeemers based on txInfo 
    async getRedeemerFromCBOR(txInfo, bNftTask = false) {
        if (undefined === txInfo.redeemers) {
            return undefined;
        }

        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let redeemerData = this.nftCCTxBuilderObj.deCodeTxRedeemersCbor(txInfo, false);
            console.log("\n\ngetRedeemerFromCBOR...nft: ", redeemerData);
            return redeemerData;
        }

        let redeemerData = await this.ccTxBuilderObj.deCodeTxRedeemersCbor(txInfo, false);
        console.log("\n\ngetRedeemerFromCBOR: ", redeemerData);
        return redeemerData;
    }

    // to get&decode mint-tx redeemers based on txInfo 
    async getTokenRedeemerFromCBOR(txInfo, bNftTask = false) {
        if (undefined === txInfo.redeemers) {
            return undefined;
        }

        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let redeemerData = this.nftCCTxBuilderObj.deCodeTxRedeemersCbor(txInfo, true);
            console.log("\n\ngetRedeemerFromCBOR...nft: ", redeemerData);
            return redeemerData;
        }

        let redeemerData = await this.ccTxBuilderObj.deCodeTxRedeemersCbor(txInfo, true);
        // let bMintTx = true;
        // let redeemerData = await this.ccTxBuilderObj.deCodeTxRedeemersCbor(txInfo, bMintTx);
        console.log("\n\ngetTokenRedeemerFromCBOR: ", redeemerData);
        return redeemerData;
    }

    checkIfContainTreasuryUtxo(txInputUtxos, bNftTask = false) {
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let bRet = this.nftCCTxBuilderObj.checkIfContainTreasuryUtxo(txInputUtxos);
            return bRet;
        }

        let bRet = this.ccTxBuilderObj.checkIfContainTreasuryUtxo(txInputUtxos);
        return bRet;
    }

    getValidPolicyId(bNftTask = false) {
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let policyId = this.nftCCTxBuilderObj.getValidPolicyId();
            return policyId;
        }

        let policyId = this.ccTxBuilderObj.getValidPolicyId();
        return policyId;
    }

    addressToPkhOrScriptHash(address, bNftTask = false) {
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let pkh = this.nftCCTxBuilderObj.addressToPkhOrScriptHash(address);
            return pkh;
        }

        let pkh = this.ccTxBuilderObj.addressToPkhOrScriptHash(address);
        return pkh;
    }

    async confirmTx(txHash, bNftTask = false) {
        /* Modify By NFT Program: 
            add nft tx builder object
        */

        if (bNftTask) {
            await this.nftCCTxBuilderObj.confirmTx(txHash);
            return;
        }

        await this.ccTxBuilderObj.confirmTx(txHash);
    }

    revertUtxoPendingComsumedStatus(inputUtxos) {

        this.ccTxBuilderObj.revertUtxoPendingComsumedStatus(inputUtxos);

        // /* Modify By NFT Program: 
        //     add nft tx builder object
        // */
        // this.nftCCTxBuilderObj.revertUtxoPendingComsumedStatus(inputUtxos);
    }

    // 
    async getTreasuryCheckUtxosTotalNum(bNftTask = false) {
        let bMintCheck = false;
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let utxoNum = await this.nftCCTxBuilderObj.getTreasuryCheckUtxosTotalNum(bMintCheck);
            return utxoNum;
        }

        let utxoNum = await this.ccTxBuilderObj.getTreasuryCheckUtxosTotalNum(bMintCheck);
        console.log("\n\n getTreasuryCheckUtxosTotalNum: ", utxoNum);
        return utxoNum;
    }

    // 
    async getMintTreasuryCheckUtxosTotalNum(bNftTask = false) {
        let bMintCheck = true;
        /* Modify By NFT Program: 
            add nft tx builder object
        */
        if (bNftTask) {
            let utxoNum = await this.nftCCTxBuilderObj.getTreasuryCheckUtxosTotalNum(bMintCheck);
            return utxoNum;
        }

        let utxoNum = await this.ccTxBuilderObj.getTreasuryCheckUtxosTotalNum(bMintCheck);
        console.log("\n\n getMintTreasuryCheckUtxosTotalNum: ", utxoNum);
        return utxoNum;
    }


    async checkNFTRefAssets(refAssetHolder, refAssets) {

        let ret = this.nftCCTxBuilderObj.checkNFTRefAssets(refAssetHolder, refAssets);

        // true: available and no need to mint; 
        // false: need to mint this kind ref assets
        return ret;
    }

    genNFTAssetName(name, typeCode) {

        let ret = this.nftCCTxBuilderObj.genNFTAssetName(name, typeCode);
        return ret;
    }

}


module.exports = PlutusTxService;
