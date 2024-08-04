const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
if (CardanoWasm.__wasm.memory.buffer.byteLength < 6000000)
    CardanoWasm.__wasm.memory.grow(100);

const common = require('../util/common');
const config = require('../config');

class AdaExtraService {

    constructor(addrPrefix) {

        this.commonUtil = new common(addrPrefix);
    }


    parseExtraBindAdaUtxos(bnStrippedTreshold, availableUtxos, assetUnit) {

        let extrableUtxo = undefined;

        // to fetch utxo which should be stripped 
        let availableAssetUtxos = this.commonUtil.filterUtxosByAssetUnit(availableUtxos, assetUnit);
        for (let i = 0; i < availableAssetUtxos.length; i++) {
            let utxoValueAry = availableAssetUtxos[i].txOut.value;

            for (let j = 0; j < utxoValueAry.length; j++) {
                let bnExtraAmount = undefined;

                // to fetch bind-ada amount
                if ("lovelace" === utxoValueAry[j].unit) {
                    bnExtraAmount = CardanoWasm.BigNum.from_str(utxoValueAry[j].quantity);
                    if (0 < bnExtraAmount.compare(bnStrippedTreshold)) {
                        extrableUtxo = availableAssetUtxos[i];
                        return extrableUtxo;
                    }
                }
            }
        }

        return extrableUtxo;
    }

}


module.exports = AdaExtraService;
