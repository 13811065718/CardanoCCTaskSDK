
const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');

class CompareTool {

    constructor(){

    }

    number2String(value) {

        if (typeof value === 'string') {
            return value;
        } else {
            return value.toString();
        }
    }

    compareUtxoAssetValue(assetUnit) {

        return function(utxoItemA, utxoItemB){

            if ((undefined === utxoItemA) || (undefined === utxoItemB)
                || (undefined === utxoItemA.txOut) || (undefined === utxoItemB.txOut)
                || (undefined === utxoItemA.txOut.value) || (undefined === utxoItemB.txOut.value)) {
                return undefined;
            }    
    
            let itemAssetValueA = CardanoWasm.BigNum.from_str("0");
            for (let v = 0; v < utxoItemA.txOut.value.length; v++) {
                let valueItem = utxoItemA.txOut.value[v];
                if (assetUnit === valueItem.unit) {
                    console.log("valueItem A: ", valueItem);
                    let tmpAmount = CardanoWasm.BigNum.from_str(valueItem.quantity.toString());
                    itemAssetValueA = itemAssetValueA.checked_add(tmpAmount);
                }
            }    
    
            let itemAssetValueB = CardanoWasm.BigNum.from_str("0");;
            for (let v = 0; v < utxoItemB.txOut.value.length; v++) {
                let valueItem = utxoItemB.txOut.value[v];
                if (assetUnit === valueItem.unit) {
                    console.log("valueItem B: ", valueItem);
                    let tmpAmount = CardanoWasm.BigNum.from_str(valueItem.quantity.toString());
                    itemAssetValueB = itemAssetValueB.checked_add(tmpAmount);
                }
            }
    
            if (itemAssetValueA > itemAssetValueB) {
                return 1;
            } else if (itemAssetValueA === itemAssetValueB) {
                return 0;
            } else {
                return -1;
            }
        }
    }


    sortUtxoByValue(formatUtxos){

        // let formatUtxos = this.formatUtxoData(utxos);
        // if(0 === formatUtxos.length){
        //     return formatUtxos;
        // }
        console.log("Utxos befor sorted: ", formatUtxos);

        let assetType = "0x973a5d0513309e32db4fd6ef3da953ffaa";

        formatUtxos.sort(this.compareUtxoAssetValue(assetType));
        console.log("\n\nSorted Utxos: ", formatUtxos);

    }

    checkDivision(iNumerator, iDenominator){

        let iDivision = parseFloat(iNumerator/iDenominator);
        let strDivision = 1; //this.number2String(iDivision);
        console.log("\n\n...checkDivision...strDivision: ", strDivision);


        let bnDivision = CardanoWasm.BigNum.from_str(strDivision);        
        console.log("\n\n...checkDivision...bnDivision: ", bnDivision.to_str());

        return bnDivision;
    }

}

function main(){
    let strAssetUnit = "0145d252838.093da23";
    // strAssetUnit = strAssetUnit.split(".");
    // console.log("\n\n strAssetUnit: ", strAssetUnit);


    let [policyId, name] = strAssetUnit.split(".");
    console.log("\n\n strAssetUnit: ", policyId, name);


    let strAssetUnit2 = "0145d252838.093da23";
    strAssetUnit2 = strAssetUnit2.replace(".", "");
    console.log("\n\n strAssetUnit2: ", strAssetUnit2);

    let redeemers = {
        "spend:0": "0x2135ddf",
        "spend:2": "0x1235ddf",
        "spend:3": "0x3335ddf"
    }

    let redeemerKey = "spend:"+ 2;
    let redeemerValue = redeemers[redeemerKey];
    console.log("\n\n redeemerValue:", redeemerKey, redeemerValue);


    let mintValue = parseInt("100036");
    let burnValue = parseInt("-10036");
    if(0 > burnValue){
        burnValue = 0-burnValue;
    }
    console.log("burnValue: ", burnValue);

    let mintage = CardanoWasm.BigNum.from_str("0");
    mintage = mintage.checked_add(CardanoWasm.BigNum.from_str(mintValue.toString()));
    mintage = mintage.checked_sub(CardanoWasm.BigNum.from_str(burnValue.toString()));

    console.log("final mintage: ", mintage.to_str());
    




    let utxos = new Array();
    utxos.push({
        txIn: {
            "txId": "0x12315",
            "index": 1
        },
        txOut:{
            "address": "0x9e5feb6c01dcda01a800d53231a6f7973a5d0513309e32db4fd6ef3da953ffaa",
            "value":[{
                "unit": "lovelace",
                "quantity": 1000
            },{
                "unit": "0x973a5d0513309e32db4fd6ef3da953ffaa",
                "quantity": 218
            }]
        }
    });
    utxos.push({
        txIn: {
            "txId": "0x12325",
            "index": 1
        },
        txOut:{
            "address": "0x9e5feb6c01dcda01a800d53231a6f7973a5d0513309e32db4fd6ef3da953ffaa",
            "value":[{
                "unit": "lovelace",
                "quantity": 1000
            },{
                "unit": "0x973a5d0513309e32db4fd6ef3da953ffaa",
                "quantity": 2558
            }]
        }
    });
    utxos.push({
        txIn: {
            "txId": "0x12335",
            "index": 1
        },
        txOut:{
            "address": "0x9e5feb6c01dcda01a800d53231a6f7973a5d0513309e32db4fd6ef3da953ffaa",
            "value":[{
                "unit": "lovelace",
                "quantity": 25
            },{
                "unit": "0x973a5d0513309e32db4fd6ef3da953ffaa",
                "quantity": 558
            }]
        }
    });
    utxos.push({
        txIn: {
            "txId": "0x12345",
            "index": 1
        },
        txOut:{
            "address": "0x9e5feb6c01dcda01a800d53231a6f7973a5d0513309e32db4fd6ef3da953ffaa",
            "value":[{
                "unit": "lovelace",
                "quantity": 763
            },{
                "unit": "0x973a5d0513309e32db4fd6ef3da953ffaa",
                "quantity": 255
            }]
        }
    });
    utxos.push({
        txIn: {
            "txId": "0x12355",
            "index": 1
        },
        txOut:{
            "address": "0x9e5feb6c01dcda01a800d53231a6f7973a5d0513309e32db4fd6ef3da953ffaa",
            "value":[{
                "unit": "lovelace",
                "quantity": 39
            },{
                "unit": "0x973a5d0513309e32db4fd6ef3da953ffaa",
                "quantity": 58
            }]
        }
    });
    utxos.push({
        txIn: {
            "txId": "0x12365",
            "index": 1
        },
        txOut:{
            "address": "0x9e5feb6c01dcda01a800d53231a6f7973a5d0513309e32db4fd6ef3da953ffaa",
            "value":[{
                "unit": "lovelace",
                "quantity": 1890
            },{
                "unit": "0x973a5d0513309e32db4fd6ef3da953ffaa",
                "quantity": 1558
            }]
        }
    });

    let compareToolObj = new CompareTool();

    compareToolObj.sortUtxoByValue(utxos);


    compareToolObj.checkDivision(1, 6);


}


main();