const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
if (CardanoWasm.__wasm.memory.buffer.byteLength < 6000000)
    CardanoWasm.__wasm.memory.grow(100);

const Common = require('./util/common');
const Config = require('./config');
const Cbor = require('cbor-sync');
const UtxoSelectionService = require('./bizServices/utxoSelectionService');
const NftContractService = require('./bizServices/nftContractService');


class PlutusNftTxBuilder {

    constructor(chainConnector, scriptRefOwnerAddr, utxosManager, logUtil, bMainnet) {
        this.connector = chainConnector;
        this.scriptRefOwnerAddr = scriptRefOwnerAddr;
        this.bMainnet = bMainnet;
        this.utxosManagerObj = utxosManager;

        this.ADDR_PREFIX = Config.PlutusCfg.testnetPrefix;
        this.network_id = CardanoWasm.NetworkInfo.testnet().network_id();
        if (bMainnet) {
            this.ADDR_PREFIX = Config.PlutusCfg.mainnetPrefix;
            this.network_id = CardanoWasm.NetworkInfo.mainnet().network_id();
        }
        this.maxPlutusUtxoNum = Config.PlutusCfg.maxUtxoNum;

        this.coinsPerUtxoWord = undefined;
        this.minFeeA = undefined;
        this.minFeeB = undefined;
        this.protocolParams = undefined;

        // to record the current gpk
        this.curChainTip = undefined;
        this.curLatestBlock = undefined;
        this.groupPK = undefined;

        // to record pending consumed utxos
        // this.mapMultiAssetUTXO = new Map();
        this.mapAccountLocker = new Map();

        // supportted token 
        this.mapValidAssetType = new Map();

        // to new common util instance
        this.commonUtil = new Common(this.ADDR_PREFIX);
        this.utxoSelectionService = new UtxoSelectionService(this.ADDR_PREFIX);
        this.contractService = new NftContractService(bMainnet, this.ADDR_PREFIX, logUtil);

        this.logger = logUtil;
    }

    async init() {
        let stakeCred = await this.getGroupInfoStkVh();
        this.lockerScAddress = this.contractService.getLockerScAddress(stakeCred);
        // this.lockerScAddress = "addr_test1qq0rlnqmmmrl4wzy35nt0pzsuu88h78swk4wnjrpzy8yk62mqlt3z2733rdlarwrd0l9sgx5t99qgsejv52qrzwmm8hqfvmgam";
        console.log("\n\n..init...this.lockerScAddress: ", this.lockerScAddress);

        this.signMode = this.contractService.getSignMode();
        this.validPolicyId = this.contractService.getValidPolicyId();

        this.utxosManagerObj.setNftTreasuryScAddress(this.lockerScAddress);
        console.log("\n\n\n\******* this.lockerScAddress: ", this.lockerScAddress);
    }

    //////////////////////////////////////////
    //// PART 1: plutus contracts related api
    //////////////////////////////////////////
    async checkNFTRefAssets(refAssetHolder, refAssets) {

        let mapAssetAvailable = new Map();
        for (let j = 0; j < refAssets.length; j++) {
            let assetUnit = refAssets[j];
            mapAssetAvailable.set(assetUnit, false);
        }

        let utxos = await this.utxosManagerObj.getUtxo(refAssetHolder, false);
        for (let i = 0; i < utxos.length; i++) {
            /*
            {
                txHash: utxo.tx_hash,
                index: utxo.tx_index,
                value: {
                    coins: coinsAmount,
                    assets: mapAsset
                },
                address: utxo.address,
                datum: utxoDatum,
                datumHash: utxo.datumHash,
                script: utxo.script,
                blockHeight: utxo.blockHeight
            }            
            */
            let itemAssets = utxos[i].value.assets;
            for (let assetUnit of itemAssets.keys()) {
                let index = refAssets.indexOf(assetUnit);
                if (-1 !== index) {
                    mapAssetAvailable.set(assetUnit, true);
                }
            }
        }

        return mapAssetAvailable;
    }

    genNFTAssetName(name, typeCode) {
        let ret = this.commonUtil.genNFTAssetName(name, typeCode);
        return ret;
    }

    getNFTRefHolderScript() {
        // need to check whether this hold address is given by sc sdk?? or transfer by agent??
        let nftRefHolderAddr = this.contractService.getRefHolderScript();
        return nftRefHolderAddr;
    }

    async genRedeemProofHash(proofInfo) {
        try {
            if (undefined === this.groupInfoToken) {
                this.groupInfoToken = await this.getGroupInfoToken();
                // this.logger.debug("..PlutusNftTxBuilder......genRedeemProofHash()... init groupInfoToken: ", this.groupInfoToken);
                if (false === this.groupInfoToken) {
                    throw "network exception";
                }

                this.groupPK = this.contractService.getGroupPublicKey(this.groupInfoToken.datum);
            }

            let redeemerProof = {
                to: proofInfo.to,
                crossValue: proofInfo.crossValue,
                txHash: proofInfo.txHash,
                index: proofInfo.index,
                mode: this.signMode,
                signature: '',
                // pk: this.groupPK,
                uniqueId: proofInfo.uniqueId,
                policy_id: proofInfo.policyId,
                txType: proofInfo.txType,
                ttl: proofInfo.ttl
            }
            // this.logger.debug("..PlutusNftTxBuilder......genRedeemProofHash redeemerProof: ", JSON.stringify(redeemerProof, null, 0))
            let redeemProofHash = this.contractService.caculateRedeemDataHash(redeemerProof, false);
            this.logger.debug("..PlutusNftTxBuilder......genRedeemProofHash caculateRedeemDataHash: ", redeemProofHash);

            return redeemProofHash;
        } catch (e) {
            this.logger.error("..PlutusNftTxBuilder...genRedeemProofHash...catch error : ", e);
            throw e;
        }
    }

    async genTokenRedeemProofHash(proofInfo) {
        try {
            if (undefined === this.groupInfoToken) {
                this.groupInfoToken = await this.getGroupInfoToken();
                // this.logger.debug("..PlutusNftTxBuilder......genRedeemProofHash()... init groupInfoToken: ", this.groupInfoToken);
                if (false === this.groupInfoToken) {
                    throw "network exception";
                }

                this.groupPK = this.contractService.getGroupPublicKey(this.groupInfoToken.datum);
            }

            let redeemerProof = {
                to: proofInfo.to,
                // crossValue: proofInfo.crossValue,
                txHash: proofInfo.txHash,
                index: proofInfo.index,
                mode: this.signMode,
                signature: '',
                // pk: this.groupPK,
                uniqueId: proofInfo.uniqueId,
                nftAssets: proofInfo.nftAssets,
                nftRefAssets: proofInfo.nftRefAssets,
                userData: proofInfo.userData,
                ttl: proofInfo.ttl
            }
            // this.logger.debug("..PlutusNftTxBuilder......genRedeemProofHash redeemerProof: ", JSON.stringify(redeemerProof, null, 0))
            let redeemProofHash = this.contractService.caculateRedeemDataHash(redeemerProof, true);
            this.logger.debug("..PlutusNftTxBuilder......genTokenRedeemProofHash caculateRedeemDataHash: ", redeemProofHash);

            return redeemProofHash;
        } catch (e) {
            this.logger.error("..PlutusNftTxBuilder...genTokenRedeemProofHash...catch error : ", e);
            throw e;
        }
    }

    async deCodeTxRedeemersCbor(txInfo, bMintCheck) {
        // this.logger.debug("..PlutusNftTxBuilder...", txInfo.hash, "...deCodeTxRedeemersCbor txInfo: ", txInfo);

        // add exception catch for connector
        let txUtxos;
        try {
            txUtxos = await this.connector.txsUtxos(txInfo.hash);
            // this.logger.debug("..PlutusNftTxBuilder...deCodeTxRedeemersCbor...tx utxos: ", txUtxos);
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder...deCodeTxRedeemersCbor...get txsUtxos...error: ", e);
            throw e;
        }

        let redeemer = this.contractService.deCodeTxRedeemersCbor(txUtxos, bMintCheck);
        return redeemer;
    }

    checkIfContainTreasuryUtxo(txInputUtxos) {
        let bContained = false;

        // to get treasury sc address
        if (undefined === this.lockerScAddress) {
            throw "failed to initial sdk!";
        }

        // to check if contains treasury utxos
        for (let i = 0; i < txInputUtxos.length; i++) {
            let utxoOwner = txInputUtxos[i].address;
            if (this.lockerScAddress === utxoOwner) {
                bContained = true;
                break;
            }
        }

        return bContained;
    }

    async getTreasuryCheckRefAndAvailableUtxo(checkVH, bMintCheck) {
        // Step 1: treasuryCheckRefUtxo
        let treasuryCheckRef = await this.getScriptRefUtxoByVH(checkVH);
        console.log("\n..getTreasuryCheckRefAndAvailableUtxo treasuryCheckRef: ", treasuryCheckRef);
        if (undefined === treasuryCheckRef) {
            this.logger.debug("..PlutusNftTxBuilder...getScriptRefUtxo...error:: no available check ref utxo");
            return undefined;
        }

        // Step 2: treasuryCheckUxto  : to monitor this script check utxos
        let scriptCheckRefAddress = await this.getTreasuryCheckAddress(bMintCheck);
        console.log("\n..getTreasuryCheckRefAndAvailableUtxo scriptCheckRefAddress: ", scriptCheckRefAddress);
        let treasuryCheckUxto = await this.getScriptCheckRefAvailableUtxo(scriptCheckRefAddress);
        console.log("\n..getTreasuryCheckRefAndAvailableUtxo treasuryCheckUxto: ", treasuryCheckUxto);
        if (undefined === treasuryCheckUxto) {
            this.logger.debug("..PlutusNftTxBuilder...getScriptCheckRefAvailableUtxo...warning:: no available check utxo");
            return undefined;
        }

        let ret = {
            "checkUtxo": treasuryCheckUxto,
            "checkRef": treasuryCheckRef
        }
        return ret;
    }

    async getTreasuryCheckUtxosTotalNum(bMintCheck) {
        let scriptCheckRefAddress = await this.getTreasuryCheckAddress(bMintCheck);
        let availableCheckUtxoCount = 0;

        let utxos = await this.utxosManagerObj.getUtxo(scriptCheckRefAddress, false);
        for (let i = 0; i < utxos.length; i++) {
            let utxoItem = {
                "txId": utxos[i].txHash,
                "index": utxos[i].index
            }
            // this.logger.debug(`..PlutusNftTxBuilder...release utxo: ${utxoItem.txId + '#' + utxoItem.index}`);
            let transaction_id = CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxoItem.txId, 'hex'));
            let txInput = CardanoWasm.TransactionInput.new(transaction_id, utxoItem.index);

            // to generate utxoId by txInput
            let utxoId = txInput.to_hex();
            // this.logger.debug(`..PlutusNftTxBuilder..getTreasuryCheckUtxosTotalNum...to match Key: ${utxoId}`);

            let mapConsumedUtxos = this.utxosManagerObj.getPendingComsumedUtxoByAddress(scriptCheckRefAddress);
            if (mapConsumedUtxos.get(utxoId)) {
                // this.logger.debug(`..PlutusNftTxBuilder..release utxoId: #${utxoId} in pendingUtxo of address: ${address}`);
                continue;
            };

            availableCheckUtxoCount++;
        }

        this.logger.debug("..PlutusNftTxBuilder...availalbe check utxos num: ", bMintCheck, scriptCheckRefAddress, availableCheckUtxoCount);
        return availableCheckUtxoCount;
    }

    async getScriptCheckRefAvailableUtxo(scriptCheckRefAddress) {

        let utxos = await this.utxosManagerObj.getUtxo(scriptCheckRefAddress, false);
        this.logger.debug("..PlutusNftTxBuilder......get scriptCheckRef utxos: ", scriptCheckRefAddress, utxos.length);
        if (0 === utxos.length) {
            this.logger.debug("..PlutusNftTxBuilder.....warning: get no scriptCheckRef utxos.");
            return undefined;
        }

        let availableUtxos = this.utxosManagerObj.checkAvailableUtxos(scriptCheckRefAddress, utxos, true);
        // this.logger.debug("..PlutusNftTxBuilder......availableUtxos: ", availableUtxos);
        if ((undefined === availableUtxos) || (availableUtxos.length < 1)) {
            this.logger.debug("..PlutusNftTxBuilder...getScriptCheckRefAvailableUtxo...warning: no available check utxo");
            return undefined;
        }

        let treasuryCheckUxto = undefined; // availableTreasuryCheckUxto

        let txId = availableUtxos[0].txIn.txId;
        let txIndex = availableUtxos[0].txIn.index;
        for (let k = 0; k < utxos.length; k++) {
            let utxo = utxos[k];
            if ((txId === utxo.txHash) && (txIndex === utxo.index)) {
                treasuryCheckUxto = utxo;
                // this.logger.debug("..PlutusNftTxBuilder......selected availableUtxos: ", utxo);
                // to add new pending consumed utxos for scriptCheckRefAddress
                this.utxosManagerObj.appendPendingComsumedUtxo(scriptCheckRefAddress, availableUtxos[0], this.curChainTip.slot);

                break;
            }
        }

        return treasuryCheckUxto;
    }

    async getScriptRefUtxoByVH(checkVH) {
        let refUtxo = await this.utxosManagerObj.getUtxo(this.scriptRefOwnerAddr, false);
        console.log(`..PlutusNftTxBuilder....getScriptRefUtxoByVH ${refUtxo.length} utxos of scriptRefOwner: ${this.scriptRefOwnerAddr} `);

        const ref = refUtxo.find(o => {
            const buf = Buffer.from(o.script['plutus:v2'], 'hex');
            const cborHex = Cbor.encode(buf, 'buffer');

            return CardanoWasm.PlutusScript.from_bytes_v2(cborHex).hash().to_hex() == checkVH

        });
        console.log(`..PlutusNftTxBuilder....getScriptRefUtxoByVH result: ${ref} `);
        if (undefined === ref) {
            return undefined;
        }
        // this.logger.debug(`..PlutusNftTxBuilder.... getScriptRefUtxoByVH's ref-utxo: ${JSON.stringify(ref)} `);
        return ref;
    }

    async getScriptRefUtxo(script) {
        let refUtxo = await this.utxosManagerObj.getUtxo(this.scriptRefOwnerAddr, false);
        // this.logger.debug(`..PlutusNftTxBuilder....get ${refUtxo.length} utxos of scriptRefOwner: ${this.scriptRefOwnerAddr} `);

        const ref = refUtxo.find(o => script.to_hex().indexOf(o.script['plutus:v2']) >= 0);
        if (undefined === ref) {
            return undefined;
        }
        // this.logger.debug(`..PlutusNftTxBuilder.... scriptRefOwner's ref-utxo: ${JSON.stringify(ref)} `);
        return ref;
    }

    getLockerScAddress() {
        // this.lockerScAddress = this.contractService.getLockerScAddress(stakeCred);
        return this.lockerScAddress;
    }

    getValidPolicyId() {
        // this.validPolicyId = this.contractService.getValidPolicyId();
        return this.validPolicyId
    }

    addressToPkhOrScriptHash(address) {
        let phk = this.contractService.addressToPkhOrScriptHash(address);
        return phk;
    }

    async getGroupInfoToken() {

        const groupInfo = this.contractService.getGroupInfoHolder();
        const groupInfoHolder = groupInfo.groupHolder;
        const expectedTokenId = groupInfo.tokenId;

        console.log("..getGroupInfoToken: ", groupInfo);

        const groupInfoToken = (await this.utxosManagerObj.getUtxo(groupInfoHolder)).find(o => {
            console.log("utxosManager get utxo ret: ", groupInfoHolder, o);
            for (let tokenId in o.value.assets) {
                tokenId = tokenId.replace(".", "");
                console.log("utxosManager tokenId: ", tokenId);
                if (tokenId == expectedTokenId) return true;
            }
            return false;
        });
        //this.logger.debug("..PlutusNftTxBuilder......groupInfoToken ", groupInfoToken);
        if (undefined === groupInfoToken) {
            return false;
        }
        console.log("..getGroupInfoToken groupInfoToken: ", groupInfoToken);
        return groupInfoToken;
    }

    async getGroupInfoStkVh() {
        this.groupInfoToken = await this.getGroupInfoToken();
        //this.logger.debug("..PlutusNftTxBuilder......getGroupInfoToken...: ", this.groupInfoToken);
        console.log("..groupInfoToken: ", this.groupInfoToken);
        if (false === this.groupInfoToken) {
            throw "getGroupInfoStkVh: exception network during get group info token";
        }

        let StkVh = this.contractService.getGroupInfoStkVh(this.groupInfoToken.datum);
        //this.logger.debug("..PlutusNftTxBuilder......groupInfoFromDatum...StkVh: ", StkVh);
        console.log("..getGroupInfoToken StkVh: ", StkVh);
        return StkVh;
    }

    async getTreasuryCheckAddress(bMintCheck) {
        this.groupInfoToken = await this.getGroupInfoToken();
        // this.logger.debug("..PlutusNftTxBuilder......getGroupInfoToken...: ", this.groupInfoToken);
        if (false === this.groupInfoToken) {
            throw "getTreasuryCheckAddress: exception network during get group info token";
        }

        let checkAddress = this.contractService.getTreasuryCheckAddress(bMintCheck, this.groupInfoToken.datum);
        return checkAddress;
    }

    //////////////////////////////////////////////////////
    //// PART 2: to fetch online data from ogmios service
    //////////////////////////////////////////////////////
    async convertSlotToTimestamp(slot) {

        try {
            const eraSummaries = await this.connector.queryEraSummaries();
            const genisis = await this.connector.queryGenesisConfig();

            return this.commonUtil.slotToTimestamp(slot, eraSummaries, genisis);

        } catch (err) {
            throw `convertSlotToTimestamp failed:  ${err}`;
        }
    }

    async getCurChainParams() {
        let latestChainTip = undefined;
        try {
            latestChainTip = await this.connector.chainTip();
            // this.logger.debug("..PlutusNftTxBuilder......latestChainTip: ", latestChainTip);
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder......failed to get chainTip: ", e);
            return false;
        }

        // step 2: to get lock 
        if ((undefined !== this.curChainTip)
            && ((this.curChainTip.slot + Config.ChainStatusValidLatestSlot) > latestChainTip.slot)) {
            return true;
        }

        while (this.mapAccountLocker.get("latestChainStatusLocker")) {
            await this.commonUtil.sleep(1000);
        }

        this.mapAccountLocker.set("latestChainStatusLocker", true);

        if ((undefined === this.curChainTip)
            || ((this.curChainTip.slot + Config.ChainStatusValidLatestSlot) <= latestChainTip.slot)) {
            try {
                // to filter utxos in security block scopes
                this.curLatestBlock = await this.connector.blocksLatest();
                // this.logger.debug("..PlutusNftTxBuilder......this.curLatestBlock: ", this.curLatestBlock);
            } catch (e) {
                this.logger.debug("..PlutusNftTxBuilder......get blocksLatest failed: ", e);
                this.mapAccountLocker.set("latestChainStatusLocker", false);
                return false;
            }

            try {
                let tmpProtocolParams = await this.connector.getCurrentProtocolParameters();
                // this.logger.debug("..PlutusNftTxBuilder......protocolParams: ", this.protocolParams);
                if ((undefined === tmpProtocolParams) || ("" === tmpProtocolParams)) {
                    this.logger.debug("..PlutusNftTxBuilder......getCurChainParams failed: ");
                    this.mapAccountLocker.set("latestChainStatusLocker", false);
                    return false;
                }

                this.protocolParams = tmpProtocolParams;
                this.minFeeA = JSON.stringify(this.protocolParams.minFeeCoefficient);
                this.minFeeB = JSON.stringify(this.protocolParams.minFeeConstant);
                this.coinsPerUtxoWord = JSON.stringify(this.protocolParams.coinsPerUtxoByte * 2);
                this.maxTxSize = JSON.stringify(this.protocolParams.maxTxSize);

                const v1 = CardanoWasm.CostModel.new();
                let index = 0;
                for (const key in this.protocolParams.costModels["plutus:v1"]) {
                    v1.set(index, CardanoWasm.Int.new_i32(this.protocolParams.costModels["plutus:v1"][key]));
                    index++;
                }

                const v2 = CardanoWasm.CostModel.new();
                index = 0;
                for (const key in this.protocolParams.costModels["plutus:v2"]) {
                    v2.set(index, CardanoWasm.Int.new_i32(this.protocolParams.costModels["plutus:v2"][key]));
                    index++;
                }
                this.protocolParams.costModels = CardanoWasm.Costmdls.new();
                this.protocolParams.costModels.insert(CardanoWasm.Language.new_plutus_v1(), v1);
                this.protocolParams.costModels.insert(CardanoWasm.Language.new_plutus_v2(), v2);

            } catch (e) {
                this.logger.debug("..PlutusNftTxBuilder......getCurChainParams failed: ", e);
                this.mapAccountLocker.set("latestChainStatusLocker", false);
                return false;
            }

            try {
                this.curChainTip = await this.connector.chainTip();
                this.logger.debug("..PlutusNftTxBuilder......get this.curChainTip onchain: ", this.curChainTip);

            } catch (e) {
                this.logger.debug("..PlutusNftTxBuilder......get chainTip failed: ", e);
                this.mapAccountLocker.set("latestChainStatusLocker", false);
                return false;
            }

        }

        this.mapAccountLocker.set("latestChainStatusLocker", false);
        return true;
    }

    async confirmTx(txHash) {
        if (undefined === this.lockerScAddress) {
            throw "failed to initial sdk!";
        }
        // this.logger.debug("..PlutusNftTxBuilder...", txHash, "...confirmTx...lockerScAddress: ", this.lockerScAddress);

        let mapConsumedUtxos = this.utxosManagerObj.getPendingComsumedUtxoByAddress(this.lockerScAddress);
        if (undefined === mapConsumedUtxos) {
            // this.logger.debug("..PlutusNftTxBuilder...", txHash, "...confirmTx...no pending utxos for: ", this.lockerScAddress);
            return;
        }

        // add exception catch for connector
        let txUtxos;
        try {
            txUtxos = await this.connector.txsUtxos(txHash);
            //  this.logger.debug("..PlutusNftTxBuilder...", txHash, "...confirmTx...tx utxos: ", txUtxos);
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder...", txHash, "...confirmTx...get txsUtxos...error: ", e);
            throw e;
        }

        for (let j = 0; j < txUtxos.inputs.length; j++) {
            const tmp = txUtxos.inputs[j];

            if (tmp.address === this.lockerScAddress) {
                // to generate tx input based on txId&index
                let transaction_id = CardanoWasm.TransactionHash.from_bytes(Buffer.from(tmp.tx_hash, 'hex'));
                let txInput = CardanoWasm.TransactionInput.new(transaction_id, tmp.output_index);

                // to generate utxoId by txInput
                let utxoId = txInput.to_hex();
                // this.logger.debug("..PlutusNftTxBuilder...", txHash, "...confirmTx...pending list remove utxoId : ", utxoId);
                // mapConsumedUtxos.delete(utxoId);
                this.utxosManagerObj.deletePendingComsumedUtxoById(this.lockerScAddress, utxoId);
            }
        }

    }

    revertUtxoPendingComsumedStatus(inputUtxos) {
        this.utxosManagerObj.revertUtxoPendingComsumedStatus(inputUtxos);
    }


    ////////////////////////////////////////////
    //// PART 4: build cross-chain tx raw data
    ////////////////////////////////////////////
    async buildSignedTx(basicArgs, internalSignFunc, partialRedeemerArgs) {
        this.logger.debug("..PlutusNftTxBuilder...buildSignedTx......basicArgs:", basicArgs);
        if (undefined === this.lockerScAddress) {
            throw "failed to initial sdk!";
        }

        //this.logger.debug("..PlutusNftTxBuilder...buildSignedTx......partialRedeemerArgs:", partialRedeemerArgs);
        this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...begin to build Signed Tx! ");
        this.paymentAddress = basicArgs.paymentAddress;
        this.paymentSkey = basicArgs.paymentSKey;

        // to add leader address for utxo manager
        this.utxosManagerObj.setSmgLeaderAddress(this.paymentAddress);
        this.utxosManagerObj.setNftTreasuryScAddress(this.lockerScAddress);

        //Step 1: to get groupInfoToken and fetch group pk
        let encodedGpk = this.commonUtil.encodeGpk(basicArgs.gpk);
        // this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...this.groupInfoToken: ", this.groupInfoToken);
        if (this.groupPK !== encodedGpk) {
        // {
            this.groupInfoToken = await this.getGroupInfoToken();
            // this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...getGroupInfoToken...: ", this.groupInfoToken);
            console.log("...getGroupInfoToken...: ", this.groupInfoToken);
            if (false === this.groupInfoToken) {
                throw "getGroupInfoToken: exception network during get group info token";
            }

            this.groupPK = this.contractService.getGroupPublicKey(this.groupInfoToken.datum);
            // this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...groupInfoFromDatum...groupPK: ", this.groupPK);
            console.log("...groupInfoFromDatum...groupPK: ", this.groupPK);

            if (this.groupPK !== encodedGpk) {
                throw "inconsistent gpk";
            }
        }
        console.log("\n\n... this.groupPK: ", this.groupPK);

        // Step 2: to get cardano current netParams
        let bRet = await this.getCurChainParams();
        // this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...getCurChainParams......bRet:", bRet);
        if (false === bRet) {
            throw "exception network during update protocal params";
        }

        // Step 3: to build cardano cross-chain tx
        let signedTx = await this.genSignedTxData(basicArgs, partialRedeemerArgs, internalSignFunc);
        // this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...genSignedTxData......ret:", signedTx);
        return signedTx;
    }

    async genSignedTxData(basicArgs, partialRedeemerArgs, internalSignFunc) {
        // this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...basicArgs: ", basicArgs);
        const owner = basicArgs.crossAddress;
        // to confirm transfer asset value
        const datum = CardanoWasm.PlutusData.new_empty_constr_plutus_data(CardanoWasm.BigNum.from_str('0'));
        /* Modify By NFT Program: 
            need to extend tokenId&tokenAmount to support multi-nft-tokens
            
            transferAmount:{
                tokenId_1: strTokenAmount_1,
                ...
                tokenId_n: strTokenAmount_n,
            }       
        */
        // assets: { [tokenId]: tokenAmount }
        const minAda = this.commonUtil.getMinAdaOfUtxo(this.protocolParams,
            owner,
            { coins: 0, assets: basicArgs.transferAmount },
            datum);
        // this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...getMinAdaOfUtxo: ", minAda, typeof (minAda));
        console.log("..PlutusNftTxBuilder......getMinAdaOfUtxo: ", minAda, typeof (minAda));

        // to build & sign normal cc tx or token mint tx by basciArgs params
        let buildRet = undefined;
        if (!basicArgs.bMint) {
            buildRet = await this.buildAndSignNftRawTx(internalSignFunc,
                basicArgs,
                minAda,
                partialRedeemerArgs);
        } else {
            buildRet = await this.buildAndSignNftMintRawTx(internalSignFunc,
                basicArgs,
                minAda,
                partialRedeemerArgs);
        }

        this.logger.debug("..PlutusNftTxBuilder...", basicArgs.hashX, "...buildAndSignRawTx...signedTxData: ", buildRet);
        return buildRet;
    }

    async buildAndSignNftRawTx(internalSignFunc, basicArgs, minAda, partialRedeemerArgs) {
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftRawTx current slot: ", this.curChainTip.slot);
        const to = basicArgs.crossAddress;
        const metaData = basicArgs.metaData;
        const uniqueId = basicArgs.hashX;

        // Step 1: to get treasury utxos for ccTask
        this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...this.lockerScAddress: ", this.lockerScAddress);
        // Step 1-1: to coin select treasury utxos for transfer
        let transferAmount = new Array();
        /* Modify By NFT Program:  
            need to extend tokenId&tokenAmount to support multi-nft-tokens, 
        format is just like:            
            transferAmount:{
                tokenId_1: tokenAmount_1,
                ...
                tokenId_n: tokenAmount_n,
            }       
        */
        let nftPolicyId = "";
        const objNftAmount = basicArgs.transferAmount;
        for (let tokenId in objNftAmount) {
            let tokenAmount = objNftAmount[tokenId];
            let [policyId, name] = tokenId.split(".");
            let strTokenAmount = this.commonUtil.number2String(tokenAmount);
            let bnTokenAmount = CardanoWasm.BigNum.from_str(strTokenAmount);
            nftPolicyId = policyId;

            let amountItem = {
                "unit": policyId,
                "name": name,
                "amount": bnTokenAmount.to_str()
            };
            transferAmount.push(amountItem);
        }
        this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...transferAmount: ", transferAmount);

        // step 1-2: to select nft utxo for ccTask
        /* Modify By NFT Program: 
            need to check if coinselection can handle multi-types utxo selection -- done!!
        */
        let contractUtxoRet = undefined;
        do {
            contractUtxoRet = await this.utxosManagerObj.getNftUtxoOfAmount(this.lockerScAddress,
                to,
                transferAmount,
                Config.PlutusCfg.maxUtxoNum,
                uniqueId,
                true);
            if (undefined === contractUtxoRet) {
                throw "failed to get treasury utxos for uniqueId: " + uniqueId;
            }

            console.log("\n\n....getNftUtxoOfAmount...contractUtxoRet: ", contractUtxoRet.checkStatus, contractUtxoRet.marginAmount);

            // in case the task takes reserved utxo with pending available status
            if (("PendingAvailable" === contractUtxoRet.checkStatus)
                || ("NoAvailable" === contractUtxoRet.checkStatus)) {
                this.commonUtil.sleep(10 * 1000);
                continue;
            }

            // in case there are enough available utxos for this task
            if ("Available" === contractUtxoRet.checkStatus) {
                break;
            }

            // in case need to merge more utxos based on preReserved utxo, 
            if ("InSufficent" === contractUtxoRet.checkStatus) {
                // step 1-3: in case of no suitable nft utxo  
                /* Modify By NFT Program: 
                    in case of no any utxo for this kind nft, need to balance nft utxos for cctask
                */
                let ret = this.selectBalanceNftUtxos(contractUtxoRet.selectedUtxos, contractUtxoRet.totalUtxos, contractUtxoRet.marginAmount);
                if (undefined !== ret) {
                    // let ret = {
                    //     "selectedUtxos": selectedNftUtxos,
                    //     "marginAmount": marginNftAmount,
                    //     "targetAmount": targetNftAmount,
                    // }
                    if ((0 === ret.marginAmount.length) && (Config.PlutusCfg.maxUtxoNum >= ret.selectedUtxos.length)) {
                        // in case coinselection is failed and there are enough available utxos for task
                        contractUtxoRet.selectedUtxos = ret.selectedUtxos;
                        break;
                    } else {
                        let mergedTxId = await this.handleNftUtxosBalance(internalSignFunc, ret.selectedUtxos, ret.targetAmount, uniqueId, nftPolicyId);
                        if (undefined === mergedTxId) {
                            console.log("\n\n...handleNftUtxosBalance mergedTxId is undefined! ");
                            // throw "handle nft utxos merging failed for uniqueId: " + uniqueId;
                        }
                    }
                }
            }

            this.commonUtil.sleep(5 * 1000);

        } while (true);

        // Step 1-4: combine selectedUtxos with target balanced utxos
        ////// Step 2-5: to get utxos for fee && collateral
        /* Modify By NFT Program: 
            need to expend the parseTreasuryUtxoChangeData params to support multi-nft transfer amount
            
            this.protocolParams,
            formatedUtxos, 
            transferNftAmount, 
            this.lockerScAddress);
        */
        let treasuryUtxo = contractUtxoRet.selectedUtxos;
        let treasuryUtxoChangeInfo = this.commonUtil.parseTreasuryNftUtxoChangeData(
            this.protocolParams,
            treasuryUtxo,
            transferAmount,
            this.lockerScAddress);
        if (undefined === treasuryUtxoChangeInfo) {
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            throw "coin select treasury utxo amount is not enough for transferAmount  for uniqueId: " + uniqueId;
        }
        // let txOutputNum = treasuryUtxoChangeInfo.outputNum;
        let marginAda = treasuryUtxoChangeInfo.marginAda;
        // let adaAmount = treasuryUtxoChangeInfo.mergedBindAda;
        // let mapMergedAmount = treasuryUtxoChangeInfo.mergedAmount;
        console.log("\n\n...parseTreasuryNftUtxoChangeData treasuryUtxoChangeInfo: ", treasuryUtxoChangeInfo);

        // Step 2: to get treasury data
        // Step 2-1: treasuryCheckRef&&Uxto 
        const treasuryCheckVH = this.contractService.getTreasuryCheckVH(this.groupInfoToken.datum);
        if (undefined == treasuryCheckVH) {
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            throw "failed to get treasury check VH for uniqueId: " + uniqueId;
        }

        let checkRefData = await this.getTreasuryCheckRefAndAvailableUtxo(treasuryCheckVH, false);
        if (undefined == checkRefData) {
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            throw "empty treasury check ref utxo  for uniqueId: " + uniqueId;
        }
        let treasuryCheckUxto = checkRefData.checkUtxo;
        let treasuryCheckRef = checkRefData.checkRef;

        // Step 2-2: treasury Ref utxo
        // NFT program modify: getTreasuryScript --> getNftTreasuryScript
        const treasuryScript = this.contractService.getTreasuryScript();
        let treasuryRef = await this.getScriptRefUtxo(treasuryScript);
        if (undefined === treasuryRef) {
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury check Utxo");
            throw "empty treasury ref utxo  for uniqueId: " + uniqueId;
        }
        this.logger.debug("..PlutusNftTxBuilder...",
            uniqueId,
            `...transferValue Treasury ref utxo: ${treasuryRef.txHash + '#' + treasuryRef.index}`);

        // Step 3: to get payment from leader
        let feeValue = new Array();
        let feeAmount = CardanoWasm.BigNum.from_str("5000000").checked_add(marginAda);
        let valueItem = {
            "unit": "lovelace",
            "name": "",
            "amount": feeAmount.to_str()
        };
        feeValue.push(valueItem);
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...begin feeValue: ", feeValue);

        let paymentUtxosRet = await this.utxosManagerObj.getUtxoOfAmount(this.paymentAddress,
            to,
            feeValue,
            undefined);
        if (undefined === paymentUtxosRet) {
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury check Utxo.");
            throw "failed to get leader utxos for fee  for uniqueId: " + uniqueId;
        }
        let utxosForFee = paymentUtxosRet.selectedUtxos;
        if (0 === utxosForFee.length) {
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury check Utxo.");
            throw "insufficent leader utxos for fee  for uniqueId: " + uniqueId;
        }
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...utxosForFee: ", utxosForFee);

        //TODO：utxosForFee 
        let validTTL = this.curChainTip.slot + Config.MaxTxTTL;
        const nonce = {
            "txHash": treasuryCheckUxto.txHash, // "9caaf865d51fc7ce403f624a260f397c0d1ac6512ebe50809d7cb09932b1d007", //
            "index": treasuryCheckUxto.index // 0 //
        };

        let ttl2Ts = validTTL;
        try {
            ttl2Ts = await this.convertSlotToTimestamp(validTTL);
        } catch (err) {
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...convertSlotToTimestamp failed: ", err);

            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury check Utxo.");
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release utxosForFee.");

            throw err;
        }

        // Step 4: to get inner sign by mpc
        let crossValue = {
            "coins": minAda,
            "assets": basicArgs.transferAmount
        };
        const redeemerProof = {
            to, crossValue: crossValue, policy_id: nftPolicyId,
            txHash: nonce.txHash, index: nonce.index, mode: this.signMode,
            txType: Config.TaskType.crossTask, uniqueId: uniqueId,
            signature: '', ttl: ttl2Ts
        };
        this.logger.debug(".....PlutusNftTxBuilder...", uniqueId, "...redeemerProof: ", JSON.stringify(redeemerProof));

        const redeemProofHash = this.contractService.caculateRedeemDataHash(redeemerProof, false);

        try {
            this.logger.debug(".....PlutusNftTxBuilder...", uniqueId, "...caculateRedeemDataHash: ", redeemProofHash);
            let signature = await internalSignFunc(partialRedeemerArgs, redeemerProof, redeemProofHash);
            redeemerProof.signature = signature;
            // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftRawTx internalSignFunc: ", signature);
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftRawTx internalSignFunc exception: ", e);

            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury check Utxo.");
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release utxosForFee.");

            throw e;
        }

        // Step 5: to build transfer value
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftRawTx transferValue: ", transferValue);
        try {
            const signedTxOutBound = await this.contractService.transferFromTreasury(this.protocolParams, utxosForFee,
                treasuryUtxo, treasuryRef, this.groupInfoToken, crossValue, to, redeemerProof, utxosForFee,
                treasuryCheckUxto, treasuryCheckRef, this.paymentAddress, this.evaluateFn.bind(this), this.signFn.bind(this),
                metaData, validTTL);

            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftRawTx signedTxOutBound finished. ");
            return signedTxOutBound;

        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftRawTx error: ", e);

            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury check Utxo.");
            this.utxosManagerObj.releaseUtxos(treasuryUtxo);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release utxosForFee.");

            throw e;
        }
    }

    async buildAndSignNftMintRawTx(internalSignFunc, basicArgs, minAda, partialRedeemerArgs) {
        const to = basicArgs.crossAddress;
        const metaData = basicArgs.metaData;
        const uniqueId = basicArgs.hashX;
        const nftRefAssets = ""; // 
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftMintRawTx current slot: ", this.curChainTip.slot);
        // Step 1-1: to coin select treasury utxos for transfer
        let transferAmount = new Array();
        /* Modify By NFT Program:  
            need to extend tokenId&tokenAmount to support multi-nft-tokens, 
        format is just like:            
            transferAmount:{
                tokenId_1: tokenAmount_1,
                ...
                tokenId_n: tokenAmount_n,
            }       
        */
        const objNftAmount = basicArgs.transferAmount;
        let mappingPolicyId = "";
        for (let tokenId in objNftAmount) {
            let tokenAmount = objNftAmount[tokenId];
            let [policyId, name] = tokenId.split(".");
            let strTokenAmount = this.commonUtil.number2String(tokenAmount);
            let bnTokenAmount = CardanoWasm.BigNum.from_str(strTokenAmount);

            mappingPolicyId = policyId;

            let amountItem = {
                "name": name,
                "amount": bnTokenAmount.to_str()
            };
            transferAmount.push(amountItem);
        }
        this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...transferAmount: ", transferAmount);

        // Step 1: to get treasury data     
        let mintCheckVH = this.contractService.getTreasuryMintCheckVH(this.groupInfoToken.datum);

        // Step 1-1: treasuryCheckRef&&Uxto 
        let mintCheckRefData = await this.getTreasuryCheckRefAndAvailableUtxo(mintCheckVH, true);
        if (undefined == mintCheckRefData) {
            throw "empty mint check ref or utxo  for uniqueId: " + uniqueId;
        }
        let mintCheckUxto = mintCheckRefData.checkUtxo;
        let mintCheckRef = mintCheckRefData.checkRef;
        const mintScript = this.contractService.getMappingTokenScript();
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...mint check Treasury ref utxo: ", mintCheckUxto, mintCheckRef);

        // Step 1-2: treasury Ref utxo
        let mappingTokenRef = await this.getScriptRefUtxo(mintScript);
        if (undefined === mappingTokenRef) {
            this.utxosManagerObj.releaseUtxos(mintCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release mint check Utxo: ", mintCheckUxto);
            throw "empty mapping token script ref  for uniqueId: " + uniqueId;
        }
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, `...transferValue Treasury ref utxo: ${mappingTokenRef.txHash + '#' + mappingTokenRef.index}`);

        // Step 2: to get leader utxos for mint fee
        let feeValue = new Array();
        let feeAmount = CardanoWasm.BigNum.from_str("5000000");
        let valueItem = {
            "unit": "lovelace",
            "name": "",
            "amount": feeAmount.to_str()
        };
        feeValue.push(valueItem);
        // this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...begin feeValue: ", feeValue);

        let paymentUtxosRet = await this.utxosManagerObj.getUtxoOfAmount(this.paymentAddress,
            to,
            feeValue,
            undefined);
        if (undefined === paymentUtxosRet) {
            this.utxosManagerObj.releaseUtxos(mintCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release mint check Utxo: ", mintCheckUxto);
            throw "get leader utxos failed for mint tx fee  for uniqueId: " + uniqueId;
        }

        let utxosForFee = paymentUtxosRet.selectedUtxos;
        if (0 === utxosForFee.length) {
            this.utxosManagerObj.releaseUtxos(mintCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release mint check Utxo: ", mintCheckUxto);
            throw "insufficent leader utxos for mint tx fee  for uniqueId: " + uniqueId;
        }

        let collateralUtxos = undefined; // len is no more than 3, sort by ada & fetch the 3 largest item

        if (Config.PlutusCfg.maxCollacteralUtxosNum < utxosForFee.length) {
            utxosForFee.sort(this.commonUtil.compareUtxoAssetValue("lovelace").bind(this));
            collateralUtxos = new Array();
            for (let i = 0; i < Config.PlutusCfg.maxCollacteralUtxosNum; i++) {
                let utxoIndex = utxosForFee.length - i - 1;
                collateralUtxos.push(utxosForFee[utxoIndex]);
            }
        } else {
            collateralUtxos = utxosForFee;
        }
        //this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...utxos For Fee & Collateral: ", utxosForFee, collateralUtxos);

        //TODO：utxosForFee 应该是个数组?--fixed
        let validTTL = this.curChainTip.slot + Config.MaxTxTTL;
        // const nonce = { txHash: mintCheckUxto.txHash, index: mintCheckUxto.index };
        const nonce = {
            "txHash": "9caaf865d51fc7ce403f624a260f397c0d1ac6512ebe50809d7cb09932b1d007", //mintCheckUxto.txHash, 
            "index": 0 //mintCheckUxto.index 
        };

        let ttl2Ts = validTTL;
        try {
            ttl2Ts = await this.convertSlotToTimestamp(validTTL);
        } catch (err) {
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftMintRawTx convertSlotToTimestamp exception: ", err);

            this.utxosManagerObj.releaseUtxos(mintCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release mint check Utxo: ", mintCheckUxto);
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release utxosForFee: ", utxosForFee);
            throw err;
        }

        const redeemerProof = {
            uniqueId: uniqueId, mode: this.signMode, txHash: nonce.txHash, index: nonce.index,
            to: to, policy_id: mappingPolicyId, nftAssets: transferAmount,
            signature: '', ttl: ttl2Ts, txTTL: validTTL,
            nftRefAssets: nftRefAssets, // nftRefAssets: provide by agent
            userData: undefined
        };

        const redeemProofHash = this.contractService.caculateRedeemDataHash(redeemerProof, true);
        this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...caculateRedeemDataHash: ", redeemProofHash);

        try {
            let signature = await internalSignFunc(partialRedeemerArgs, redeemerProof, redeemProofHash);
            redeemerProof.signature = signature;
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftMintRawTx internalSignFunc exception: ", e);
            this.utxosManagerObj.releaseUtxos(mintCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release mint check Utxo: ", mintCheckUxto);
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release utxosForFee: ", utxosForFee);
            throw e;
        }

        // Step 4: to build mint value
        try {
            // nftRefHolderAddr
            const signedTxOutBound = await this.contractService.mint(this.protocolParams, utxosForFee, collateralUtxos, mappingTokenRef,
                mintCheckRef, this.groupInfoToken, mintCheckUxto, redeemerProof, nftRefHolderAddr, this.paymentAddress,
                this.evaluateFn.bind(this), this.signFn.bind(this), validTTL, metaData);

            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftMintRawTx...signedTxOutBound finished. ");
            return signedTxOutBound;
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...buildAndSignNftMintRawTx error: ", e);
            this.utxosManagerObj.releaseUtxos(mintCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release mint check Utxo: ", mintCheckUxto);
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release utxosForFee: ", utxosForFee);
            throw e;
        }
    }

    ////////////////////////////////////////////
    //// PART 5: Utxo Balanced Processing Funs
    ////////////////////////////////////////////
    caculateUtxoPriorityByAssetMask(assetMask, formatUtxos) {
        console.log("..caculateUtxoPriorityByAssetMask assetMask: ", assetMask);

        let utxoPriorityAry = new Array();
        const WeightPrioriyPerAsset = 1000;

        for (let i = 0; i < formatUtxos.length; i++) {

            let utxoPriority = 0;
            let mapUtxoAssetInfo = new Map();

            let utxoItem = formatUtxos[i];
            console.log("..caculateUtxoPriorityByAssetMask utxoItem: ", utxoItem);
            let utxoId = this.commonUtil.encodeUtxo(utxoItem).to_hex();

            let outputs = utxoItem.txOut;
            for (let j = 0; j < outputs.value.length; j++) {
                let itemAsset = outputs.value[j];
                let strItemAmount = itemAsset.quantity;

                // to check if asset type matched
                let strAssetAmount = assetMask.get(itemAsset.unit); // the unit takes no '.' 
                if (undefined !== strAssetAmount) {
                    let amountPriority = 0;

                    let bnAssetAmount = CardanoWasm.BigNum.from_str(strAssetAmount);
                    let bnItemAmount = CardanoWasm.BigNum.from_str(strItemAmount);
                    // let ret = bnItemAmount.compare(bnAssetAmount);                    
                    if (0 > bnItemAmount.compare(bnAssetAmount)) {
                        amountPriority = 1; // the amount is less than required amount                    
                    } else {
                        amountPriority = 2; // the amount satisfy required amount
                    }

                    // to count the priority of asset amount
                    utxoPriority = utxoPriority + amountPriority;
                    // to count the priority of asset unit
                    utxoPriority = utxoPriority + WeightPrioriyPerAsset;
                    // to statistic the related asset info of this utxo
                    mapUtxoAssetInfo.set(itemAsset.unit, strItemAmount); // the unit takes no '.' 
                }
            }

            if (0 < utxoPriority) {
                let utxoPriorityInfo = {
                    "utxoId": utxoId,
                    "nftInfos": mapUtxoAssetInfo,
                    "priority": utxoPriority
                };
                console.log("..utxoPriorityInfo: ", utxoPriorityInfo);
                utxoPriorityAry.push(utxoPriorityInfo);
            }
        }

        return utxoPriorityAry;
    }

    caculateNftUtxosPriority(availableUtxos, transferNftAmount) {
        // step 1: to generate asset mask based on transferNftAmount
        let mapAssetMask = this.commonUtil.genAssetMaskByAmount(transferNftAmount);

        // step 2: to caculate utxo priority based on assetMask
        let utxoPriorityAry = this.caculateUtxoPriorityByAssetMask(mapAssetMask, availableUtxos);

        // step 3: to sort the utxos by priority
        utxoPriorityAry.sort(this.commonUtil.compareByProperty("priority"));

        return utxoPriorityAry;
    }

    getTargetUtxoForNftBalance(availableUtxos, nftAmount) {

        // to parse the priority of available nft utxos
        let utxoPriorityAry = this.caculateNftUtxosPriority(availableUtxos, nftAmount);
        if ((undefined === utxoPriorityAry) || (0 === utxoPriorityAry.length)) {
            return undefined;
        }
        console.log("\n\n...getTargetUtxoForNftBalance caculateNftUtxosPriority: ", utxoPriorityAry);

        // to return the utxo with the highest priority 
        let targetUtxo = utxoPriorityAry[0];
        console.log("...getTargetUtxoForNftBalance targetUtxo: ", targetUtxo);
        return targetUtxo;
    }

    selectBalanceNftUtxos(selectedNftUtxos, totalUtxos, transferAmount) {
        // step 1: to check if takes available nft utxos out of pending comsumed utxos or preReserved utxos
        let availableUtxos = this.utxosManagerObj.checkAvailableUtxos(this.lockerScAddress, totalUtxos, false, undefined, true);

        // in case need to select more suitable utxo for balance
        let nftAmount = transferAmount;
        let marginNftAmount = undefined;
        do {
            if (Config.PlutusCfg.maxUtxoNum <= selectedNftUtxos.length) {
                marginNftAmount = nftAmount;
                console.log("....selectBalanceNftUtxos..selected NftUtxos num: ", selectedNftUtxos.length);
                break;
            }

            // Step 2: to filter the most suitable utxos for merge
            // to sort the nftAmount by amount
            nftAmount.sort(this.commonUtil.compareByProperty("amount"));

            // to get the suitable with the top priority for nft balance
            let targetUtxoObj = this.getTargetUtxoForNftBalance(availableUtxos, nftAmount);
            if (undefined === targetUtxoObj) {
                return undefined;
            }

            // step 3:  udpate availableUtxos:  split this utxo away from array
            for (let j = 0; j < availableUtxos.length; j++) {
                let utxoObj = availableUtxos[j];
                let utxoId = this.commonUtil.encodeUtxo(utxoObj).to_hex();

                if (targetUtxoObj.utxoId === utxoId) {
                    let txId = utxoObj.txIn.txId;
                    let txIndex = utxoObj.txIn.index;
                    for (let k = 0; k < totalUtxos.length; k++) {
                        let utxo = totalUtxos[k];
                        if ((txId === utxo.txHash) && (txIndex === utxo.index)) {
                            selectedNftUtxos.push(utxo);
                            break;
                        }
                    }
                    // remove this utxo from availableUtxos
                    availableUtxos.splice(j, 1);
                    break;
                }
            }

            // update nftAmount: 
            let tmpMarginNftAmount = this.commonUtil.caculateMarginNftAmount(nftAmount, targetUtxoObj);
            if (0 === tmpMarginNftAmount.length) {
                // has reached the transfer amount
                marginNftAmount = tmpMarginNftAmount;
                break;
            }
            nftAmount = tmpMarginNftAmount;

        } while (true);

        // to mark the status of selected utxos as pendingConsumed
        let formatedUtxos = this.commonUtil.formatUtxoData(selectedNftUtxos);
        for (let i = 0; i < formatedUtxos.length; i++) {
            let formatedUtxoObj = formatedUtxos[i];
            // to add new pending consumed utxos
            this.utxosManagerObj.appendPendingComsumedUtxo(this.lockerScAddress, formatedUtxoObj, this.curChainTip.slot);
        }

        let targetNftAmount = this.commonUtil.caculateTargetNftAmount(transferAmount, marginNftAmount);
        // to return selected utxos
        let ret = {
            "selectedUtxos": selectedNftUtxos,
            "marginAmount": marginNftAmount,
            "targetAmount": targetNftAmount
        }
        console.log("....selectBalanceNftUtxos..result: ", ret);
        return ret;
    }

    // targetUtxos is formated utxo objects for balance 
    async handleNftUtxosBalance(internalSignFunc, targetUtxos, transferNftAmount, uniqueId, nftPolicyId) {
        if (undefined === this.lockerScAddress) {
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...failed to initial sdk!");
            return undefined;
        }

        let nftAssets = {};
        for (let i = 0; i < transferNftAmount.length; i++) {
            let nftUnit = transferNftAmount[i].unit + "." + transferNftAmount[i].name;
            let nftAmount = transferNftAmount[i].amount;
            nftAssets[nftUnit] = nftAmount;
        }

        // Step 1: to get treasury checkVH by datum        
        let treasuryCheckVH = this.contractService.getTreasuryCheckVH(this.groupInfoToken.datum);
        if (undefined == treasuryCheckVH) {
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...getTreasuryCheckVH...warning: EmptyCheckUtxo");
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            return undefined;
        }
        console.log("..PlutusNftTxBuilder...handleNftUtxosBalance...treasuryCheckVH: ", treasuryCheckVH);

        // Step 1-1: to get treasury check ref and utxo
        let checkRefData = await this.getTreasuryCheckRefAndAvailableUtxo(treasuryCheckVH, false);
        if (undefined == checkRefData) {
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...getTreasuryCheckRefAndAvailableUtxo...warning: EmptyCheckUtxo");
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            return undefined;
        }
        let treasuryCheckUxto = checkRefData.checkUtxo;
        let treasuryCheckRef = checkRefData.checkRef;
        const treasuryScript = this.contractService.getTreasuryScript();

        // Step 1-2: to get treasury ref and utxo
        let treasuryRef = await this.getScriptRefUtxo(treasuryScript);
        if (undefined === treasuryRef) {
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...getScriptRefUtxo...warning:.EmptyScriptRefUtxo");
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            return undefined;
        }
        this.logger.debug(`..PlutusNftTxBuilder...handleNftUtxosBalance...transferValue Treasury ref utxo: ${treasuryRef.txHash + '#' + treasuryRef.index}`);

        // Step 1-4: to caculate the total assert value of targetUtxos
        // let formatedUtxos = this.commonUtil.formatUtxoData(targetUtxos);
        let treasuryUtxoChangeInfo = this.commonUtil.parseTreasuryNftUtxoChangeData(
            this.protocolParams,
            targetUtxos,
            transferNftAmount,
            this.lockerScAddress);
        if (undefined === treasuryUtxoChangeInfo) {
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury check Utxo.");
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            this.logger.debug("..PlutusNftTxBuilder...", uniqueId, "...release treasury Utxo.");
            return undefined;
        }
        let outputNum = treasuryUtxoChangeInfo.outputNum;
        let marginAda = treasuryUtxoChangeInfo.marginAda;
        let minMergedBindAda = treasuryUtxoChangeInfo.mergedBindAda;
        let mapMergedAmount = treasuryUtxoChangeInfo.mergedAmount;

        // Step 2: to caculate the max fee for balanced tx, on leader account.
        console.log("\n\n\n..PlutusNftTxBuilder...handleNftUtxosBalance...begin to get utxosForFee: ");
        let bnFeeAmount = CardanoWasm.BigNum.from_str('2000000').checked_add(marginAda);
        let feeValue = new Array();
        let valueItem = {
            "unit": "lovelace",
            "name": "",
            "amount": bnFeeAmount.to_str()
        };
        feeValue.push(valueItem);
        // this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...begin feeValue: ", feeValue);

        let paymentUtxosRet = await this.utxosManagerObj.getUtxoOfAmount(this.paymentAddress,
            this.lockerScAddress,
            feeValue,
            undefined);
        if (undefined === paymentUtxosRet) {
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...getUtxoOfAmount...warning: get UtxoForFee failed");
            return undefined;
        }
        let utxosForFee = paymentUtxosRet.selectedUtxos;
        if (0 === utxosForFee.length) {
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...getUtxoOfAmount...warning: inSufficent Utxo For Fee");
            return undefined;
        }
        // this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance...utxosForFee: ", utxosForFee);
        console.log("..PlutusNftTxBuilder...handleNftUtxosBalance...utxosForFee: ", utxosForFee);

        // Step 3: add tx input based on utxo data  
        let validTTL = this.curChainTip.slot + Config.MaxTxTTL;
        let ttl2Ts = validTTL;
        try {
            ttl2Ts = await this.convertSlotToTimestamp(validTTL);
        } catch (err) {
            console.log("..PlutusNftTxBuilder...handleNftUtxosBalance..convertSlotToTimestamp exception: ", err);
            return undefined;
        }
        // this.logger.debug("..PlutusNftTxBuilder......handleNftUtxosBalance...validTTL: ", validTTL);
        console.log("..PlutusNftTxBuilder...handleNftUtxosBalance...converted ttl2Ts: ", ttl2Ts);

        const nonce = {
            "txHash": treasuryCheckUxto.txHash, // "9caaf865d51fc7ce403f624a260f397c0d1ac6512ebe50809d7cb09932b1d007", // 
            "index": treasuryCheckUxto.index  // 0 //
        };
        const transferValue = {
            "coins": minMergedBindAda.to_str(),
            "assets": nftAssets
        };
        const redeemerProof = {
            to: this.lockerScAddress, crossValue: transferValue, policy_id: nftPolicyId,
            txHash: nonce.txHash, index: nonce.index, mode: this.signMode, signature: '',
            txType: Config.TaskType.balancedTask, uniqueId: uniqueId, ttl: ttl2Ts, txTTL: validTTL
        };
        // this.logger.debug(".....PlutusNftTxBuilder...handleNftUtxosBalance...redeemerProof: ", JSON.stringify(redeemerProof));
        console.log("..PlutusNftTxBuilder...handleNftUtxosBalance...redeemerProof: ", JSON.stringify(redeemerProof));

        // add mpc inner sign
        const redeemProofHash = this.contractService.caculateRedeemDataHash(redeemerProof, false);
        console.log("..PlutusNftTxBuilder...handleNftUtxosBalance...redeemProofHash: ", redeemProofHash);
        // this.logger.debug(".....PlutusNftTxBuilder...handleNftUtxosBalance...caculateRedeemDataHash: ", redeemProofHash);

        try {
            // sign by leader
            let tmpPartialRedeemerArgs = {
                "hashKey": "",
                "crossTokenAddr": "",
                "amount": "",
                "fee": 0,
                "crossAddressHex": this.lockerScAddress
            };
            let signature = await internalSignFunc(tmpPartialRedeemerArgs, redeemerProof, redeemProofHash);
            console.log("..PlutusNftTxBuilder...handleNftUtxosBalance...signature: ", signature);

            redeemerProof.signature = ""; //signature;
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance internalSignFunc exception: ", e);
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance release targetUtxos.");
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance release treasuryCheckUxto.");
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            this.logger.debug("..PlutusNftTxBuilder...handleNftUtxosBalance release utxosForFee.");
            return undefined;
        }

        // Step 4: to build transaction with related params
        this.logger.debug("..PlutusNftTxBuilder......handleNftUtxosBalance...transferFromTreasury: ", transferValue);
        let metaData = {
            // empty metaData info is just ok
        };
        let signedTxOutBound = undefined;
        try {
            signedTxOutBound = await this.contractService.transferFromTreasury(this.protocolParams, utxosForFee,
                targetUtxos, treasuryRef, this.groupInfoToken, transferValue, this.lockerScAddress, redeemerProof,
                utxosForFee, treasuryCheckUxto, treasuryCheckRef, this.paymentAddress, this.evaluateFn.bind(this),
                this.signFn.bind(this), metaData, validTTL, outputNum);

            // to update the preReserved utxo for this ccTask in memeory
            let txBodyHash = CardanoWasm.hash_transaction(signedTxOutBound.body());
            // let balanceTxId = this.commonUtil.byteArray2Hexstring(txBodyHash.to_bytes());
            let balanceTxId = Buffer.from(txBodyHash.to_bytes()).toString('hex');
            console.log("balance tx Id: ", balanceTxId);

            let reservedUtxo = this.commonUtil.genFormatedUtxo(balanceTxId, 0, this.lockerScAddress, minMergedBindAda, mapMergedAmount);
            let reservedUtxoId = this.commonUtil.encodeUtxo(reservedUtxo);
            //  utxoId -> {reservedTxId, reservedAmount({unit -> amount}), reservedSlot}
            let reservedInfo = {
                "reservedTxId": uniqueId,
                "reservedAmount": mapMergedAmount,
                "reservedSlot": this.curChainTip.slot
            }
            this.utxosManagerObj.appendPreReservedUtxoInfo(reservedUtxoId, reservedInfo);

        } catch (e) {
            this.logger.error("..PlutusNftTxBuilder......transferFromTreasury...e: ", e);
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            return undefined; //throw e;
        }

        if (undefined === signedTxOutBound) {
            this.utxosManagerObj.releaseUtxos(targetUtxos);
            this.utxosManagerObj.releaseUtxos(treasuryCheckUxto);
            this.utxosManagerObj.releaseUtxos(utxosForFee);
            return undefined;
        }

        // Step 4: to submit the signed tx
        let txId = undefined
        try {
            txId = await this.connector.sendRawTransaction(signedTxOutBound.to_bytes());
            this.logger.debug("..PlutusTxBuilder......handleNftUtxosBalance......sendRawTransaction :", txId);

        } catch (e) {
            this.logger.debug("..PlutusTxBuilder......handleNftUtxosBalance......sendRawTransaction error :", e);
        }
        return txId;

    }

    ///////////////////////////////////
    //// PART 6: tx related functions
    ///////////////////////////////////
    signFn(hash) {
        const payPrvKey = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(this.paymentSkey, 'hex'));
        const signature = payPrvKey.sign(Buffer.from(hash, 'hex')).to_hex();
        const vkey = payPrvKey.to_public().to_bech32();
        // this.logger.debug("..PlutusNftTxBuilder......signFn: ", vkey, signature);
        return { vkey, signature };
    }

    async evaluateFn(rawTx) {
        // add exception catch for connector
        try {
            return await this.connector.evaluateTx(CardanoWasm.Transaction.from_hex(rawTx).to_bytes());
        } catch (e) {
            this.logger.debug("..PlutusNftTxBuilder......evaluateTx error: ", e);
            throw e;
        }
    }

}


module.exports = PlutusNftTxBuilder;
