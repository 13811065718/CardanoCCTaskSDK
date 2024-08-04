
'use strict';
const WanOgmiosAPI = require('./wanOgmiosApi');

class CardanoApiOgmios  {

    constructor(option) {  
        console.log("\n\n  ######  CardanoApiOgmios... constructor option: ", option);
        
        this.API = new WanOgmiosAPI(option.host, option.port);    }

    async getCurrentProtocolParameters() {
        // console.log("CardanoApiOgmios - getCurrentProtocolParameters begin: ");
        try{
            let ret = await this.API.currentProtocolParameters();
            // console.log("CardanoApiOgmios - getCurrentProtocolParameters ret: ", ret);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getChainTip, e: ", e);
            return null;
        }
    }

    async chainTip() {
        try{
            let ret = await this.API.chainTip();
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getChainTip, e: ", e);
            return null;
        }
    }

    async getEpochsParameters(epochNo) {
        // console.log("getEpochsParameters  epochNo: ", epochNo);
        try{
            let ret = await this.API.epochsParameters(epochNo);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - epochsParameters, e: ", e);
            return null;
        }
    }

    async blocksLatest() {
        try{
            let ret = await this.API.blocksLatest();
            // console.log("CardanoApiOgmios - getLatestBlock: ", ret);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getLatestBlock, e: ", e);
            return null;
        }
    }


    async getBlock(number) {
        try{
            let ret = await this.API.blocks(number)
            // console.log("CardanoApiOgmios - getBlock: ", ret);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getBlock, e: ", e);
            return null;
        }
    }

    async getAddressBalance(address) {
        try{
            let ret = await this.API.addressBalance(address);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getAddressBalance, e: ", e);
            return null;
        }
    }

    async getAddressUTXOs(address, pageNumber, countNumber, order = 'asc') {
        try{
            let pagination = {
                page: pageNumber,
                count: countNumber,
                order: order,
            };
            let utxos = await this.API.addressesUtxos(address, pagination);
            // temp modify
            let ret = {
                "utxos": utxos,
                "source": "ogmios"
            }

            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getAddressUTXOs, e: ", e);
            return null;
        }
    }

    async getAddressTx(address, pageNumber, countNumber, order, from, to) {

        try{
            let pagination = {
                "page": pageNumber,
                "count": countNumber,
                "order": order,
            };

            let additionalOptions = {
                "from":from,
                "to":to,
            }

            let txs = await this.API.addressesTransactions(address, pagination, additionalOptions);

            let ret = {
                "txs": txs,
                "source": "ogmios"
            }

            return ret;

        }catch (e) {
            console.log("CardanoApiOgmios - getAddressTx, e: ", e);
            return null;
        }

    }

    async sendSignedTx(signedTx) {
        
        let reslt = undefined;
        try{
            console.log("sendSignedTx signedTx:", signedTx);
            let ret = await this.API.txSubmit(signedTx);
            reslt = {
                "statusCode": 200,
                "txId": ret
            }
            console.log("sendSignedTx reslt:", reslt);
        }catch (e) {
            console.log("CardanoApiOgmios - txSubmit, e: ", e);
            reslt = {
                "statusCode": e.status_code,
                "txId": null
            }
        }
        console.log("sendSignedTx reslt:", reslt);
        return reslt;
    }

    async metadataTxsLabel(label, from, to){
        let additionalOptions = {
            "from":from,
            "to":to,
        }
        
        try{
            let ret = await  this.API.metadataTxsLabel(label, additionalOptions);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - metadataTxsLabel, e: ", e);
            return undefined;
        }
    }

    async getTxInfo(txId) {
        try{
            let ret = await this.API.txs(txId);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getTxInfo, e: ", e);
            return null;
        }
    }

    async getAddressUTXOsWithBlockHeight(address, pageNumber, countNumber, order = 'asc') {
        // console.log('CardanoClient - getAddressUTXOsWithBlockHeight: ');
        try{
            let utxos = await this.API.addressesUtxosWithBlockHeight(address, pageNumber, countNumber, order = 'asc');
            // temp modify
            let ret = {
                "utxos": utxos,
                "source": this.bUseOgmios ? "ogmios" : "blockFrost"
            }
            //console.log('CardanoClient - getAddressUTXOsWithBlockHeight ret: ', utxos);
            return ret;
        }catch (e) {
            console.log('CardanoClient - getAddressUTXOsWithBlockHeight, e: ',e);
            throw e;
        }
    }
    
    async queryEraSummaries(txId) {
        try{
            let ret = await this.API.queryEraSummaries(txId);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - queryEraSummaries, e: ", e);
            return null;
        }
    }

    async queryGenesisConfig(txId) {
        try{
            let ret = await this.API.queryGenesisConfig(txId);
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - queryGenesisConfig, e: ", e);
            return null;
        }
    }

    async getBalancedConfig(txId) {
        try{
            let balancedConfig = await this.API.getBalancedConfig(txId); 
            let ret = {
                "balancedConfig": balancedConfig,
                "source": this.bUseOgmios ? "ogmios" : "blockFrost"
            }
            return ret;
        }catch (e) {
            console.log("CardanoApiOgmios - getBalancedConfig, e: ", e);
            return null;
        }
    }
}

module.exports = CardanoApiOgmios;

