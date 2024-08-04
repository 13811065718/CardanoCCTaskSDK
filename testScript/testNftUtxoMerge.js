
const ogmiosApi = require("./CardanoApiOgmios");
const Web3 = require("web3");
const web3 = new Web3();
const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
const CoinSelectionService = require('../bizServices/utxoSelectionService');
const CommonUtils = require("../util/common");
const commonUtilObj = new CommonUtils("addr_test");


const payAddress = "addr_test1wr64gtafm8rpkndue4ck2nx95u4flhwf643l2qmg9emjajg2ww0nj";
const toAddress = "addr_test1qz6twkzgss75sk379u0e27phvwhmtqqfuhl5gnx7rh7nux2xg4uwrhx9t58far8hp3a06hfdfzlsxgfrzqv5ryc78e4s4dwh26";
const MaxUtxoNum = 5;
const PriorityFactor = 5;


function buildOgmiosService() {
	let option = {
		"host": "http://52.13.9.234",
		"port": 4337
	}

	let ogmiosInst = new ogmiosApi(option);
	return ogmiosInst;
}


function buildCoinSelectionInst() {
	let addrPrefix = "addr_test";
	let coinSelectionInst = new CoinSelectionService(addrPrefix);

	return coinSelectionInst;
}


function convertUtxosFormat(utxos) {
	let ret = new Array();

	for (let i = 0; i < utxos.length; i++) {
		const utxo = utxos[i];
		let mapAsset = new Map();
		let coinsAmount = undefined;

		for (let j = 0; j < utxo.amount.length; j++) {
			if ("lovelace" === utxo.amount[j].unit) {
				// if (coinValue && CardanoWasm.BigNum.from_str(utxo.amount[j].quantity + '').compare(
				//     CardanoWasm.BigNum.from_str('' + coinValue)
				// ) < 0) break;
				let bnCoinAmount = mapAsset[utxo.amount[j].unit];
				if (undefined === bnCoinAmount) {
					bnCoinAmount = CardanoWasm.BigNum.from_str('0');
				}
				bnCoinAmount = bnCoinAmount.checked_add(CardanoWasm.BigNum.from_str(utxo.amount[j].quantity + ''));

				coinsAmount = bnCoinAmount.to_str();

			} else {
				// console.log("..plutusNftTxBuilder......asset unit: ", utxo.amount[j].unit, utxo.amount[j].quantity + '')
				let bnAssetAmount = mapAsset[utxo.amount[j].unit];
				if (undefined === bnAssetAmount) {
					bnAssetAmount = CardanoWasm.BigNum.from_str('0');
				}
				bnAssetAmount = bnAssetAmount.checked_add(CardanoWasm.BigNum.from_str(utxo.amount[j].quantity + ''));

				// let assetUnit = utxo.amount[j].unit.replace(".", "");
				let assetUnit = utxo.amount[j].unit;
				mapAsset[assetUnit] = bnAssetAmount.to_str();
			}
		}

		// filter utxo with null datum
		ret.push({
			txHash: utxo.tx_hash,
			index: utxo.tx_index,
			value: {
				coins: coinsAmount,
				assets: mapAsset
			},
			address: utxo.address,
			datum: utxo.data_hash,
			datumHash: utxo.datumHash,
			script: utxo.script,
			blockHeight: utxo.blockHeight
		});
	}

	return ret;
}


function buildMultiNftAmount(nftAmountObj) {
	// Step 1-1: to coin select treasury utxos for transfer
	let transferAmount = new Array();

	for (let tokenId in nftAmountObj) {
		let tokenAmount = nftAmountObj[tokenId];
		console.log("\n\n...buildMultiNftAmount: ", tokenId, tokenAmount);
		let [policyId, name] = tokenId.split(".");
		let strTokenAmount = commonUtilObj.number2String(tokenAmount);
		let bnTokenAmount = CardanoWasm.BigNum.from_str(strTokenAmount);

		let amountItem = {
			"unit": policyId,
			"name": name,
			"amount": bnTokenAmount.to_str()
		};
		transferAmount.push(amountItem);
	}

	return transferAmount;
}


function caculateNftUtxoPriority(availableUtxos, transferNftAmount) {
	// to static the transfer nft types
	let mapStaticRslt = new Map();
	let nftUnitWeightDefault = transferNftAmount.length * PriorityFactor;

	for (let i = 0; i < transferNftAmount.length; i++) {
		let nftUnit = transferNftAmount[i].unit + transferNftAmount[i].name;
		let nftAmount = transferNftAmount[i].amount;
		let bnNftAmount = CardanoWasm.BigNum.from_str(nftAmount);

		let totalAssetUtxos = commonUtilObj.filterUtxosByAssetUnit(availableUtxos, nftUnit, true);
		console.log("..plutusNftTxBuilder......getUtxosByUnit:", nftUnit, totalAssetUtxos.length);
		if (0 === totalAssetUtxos.length) {
			return undefined;
		}

		let curBiasWeight = i * PriorityFactor;
		let curUnitWeight = nftUnitWeightDefault - curBiasWeight;

		for (let j = 0; j < totalAssetUtxos.length; j++) {

			let curAmountWeight = 0;
			let utxoItem = totalAssetUtxos[j];
			let utxoId = commonUtilObj.encodeUtxo(utxoItem).to_hex();

			let strAssetAmount = commonUtilObj.fetchAssetQualityInUtxo(utxoItem, nftUnit);
			let bnAssetAmount = CardanoWasm.BigNum.from_str(strAssetAmount);
			let ret = bnNftAmount.compare(bnAssetAmount);
			if (0 === ret) {
				curAmountWeight = 3; // the amount is equal with transfer amount
			} else if (-1 === ret) {
				curAmountWeight = 2; // the amount is more than transfer amount 
			} else {
				curAmountWeight = 1; // the amount is less than transfer amount
			}

			let curUtxoPriority = curUnitWeight + curAmountWeight;
			let utxoPriority = mapStaticRslt.get(utxoId);
			if (undefined === utxoPriority) {
				utxoPriority = {
					"nftInfos": new Map(),
					"priority": 0
				};
			}

			// update the priority of utxo
			utxoPriority.priority = utxoPriority.priority + curUtxoPriority;
			utxoPriority.nftInfos.set(nftUnit, strAssetAmount);
			mapStaticRslt.set(utxoId, utxoPriority);
		}
	}

	return mapStaticRslt;
}

function parseNftUtxosPriority(availableUtxos, transferNftAmount) {

	// to caculate utxo priority: utxoId -> utxoPriority
	let mapNftUtxoPriority = caculateNftUtxoPriority(availableUtxos, transferNftAmount);
	// console.log("..parseNftUtxosPriority..caculateNftUtxoPriority: ", mapNftUtxoPriority);
	if (undefined === mapNftUtxoPriority) {
		return undefined;
	}

	// sort the priority list
	let utxosPriorityAry = new Array();
	for (let [id, utxoPriority] of mapNftUtxoPriority) {
		// console.log("..parseNftUtxosPrilority..mapNftUtxoPriority id: ", id, utxoPriority);
		// let utxoPriority = mapNftUtxoPriority.get(id);
		let utxosPriorityItem = {
			"utxoId": id,
			"nftInfos": utxoPriority.nftInfos,
			"priority": utxoPriority.priority
		}
		utxosPriorityAry.push(utxosPriorityItem);
	}
	utxosPriorityAry.sort(commonUtilObj.compareByProperty("priority"));
	// console.log("..parseNftUtxosPriority..sorted priority utxos: ", utxosPriorityAry);

	return utxosPriorityAry;
}

function getTargetUtxoForNftBalance(availableUtxos, transferAmount) {
	// step 1: to parse the priority of available nft utxos
	let utxosPriorityAry = parseNftUtxosPriority(availableUtxos, transferAmount);
	if (undefined === utxosPriorityAry) {
		return undefined;
	}

	let targetUtxo = utxosPriorityAry[0];
	return targetUtxo;
}


async function selectBalanceNftUtxos(totalUtxos, transferNftAmount) {

	let utxosCollection = commonUtilObj.formatUtxoData(totalUtxos);;
	let transferAmount = transferNftAmount;
	let selectedNftUtxos = new Array();

	// in case need to select more suitable utxo for balance
	let bContinue = true;
	do {
		console.log("....\navailable utxos collection length: ", utxosCollection.length);
		console.log("....\n selected utxos length: ", selectedNftUtxos.length);
		if (MaxUtxoNum <= selectedNftUtxos.length) {
			break;
		}

		// to sort the transferAmount by amount
		transferAmount.sort(commonUtilObj.compareByProperty("amount"));
		console.log("\n\n\n\n..sorted transferAmount: ", transferAmount);
		// to get the best utxo with the top priority for nft balance
		let targetUtxoObj = getTargetUtxoForNftBalance(utxosCollection, transferAmount);
		console.log("..targetUtxoObj: ", targetUtxoObj);
		if (undefined === targetUtxoObj) {
			console.log("..there is no suitable asset for this transfer amount, please check");
			await commonUtilObj.sleep(10000);
			return undefined;
		}

		// udpate utxosCollection:  split this utxo from array
		for (let j = 0; j < utxosCollection.length; j++) {
			let utxoObj = utxosCollection[j];
			let utxoId = commonUtilObj.encodeUtxo(utxoObj).to_hex();

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

				// remove this utxo from utxosCollection
				utxosCollection.splice(j, 1);
				// console.log("....\n sliced utxo: ", utxoObj);
				// console.log("....\n sliced utxos collection length: ", utxosCollection.length);
				break;
			}
		}

		// update transferAmount: 
		let marginNftAmount = commonUtilObj.caculateMarginNftAmount(transferAmount, targetUtxoObj);
		console.log("..marginNftAmount: ", marginNftAmount);
		if (0 === marginNftAmount.length) {
			// has reached the transfer amount
			break;
		}
		transferAmount = marginNftAmount;

		await commonUtilObj.sleep(10000);

	} while (bContinue);


	return selectedNftUtxos;
}


async function nftUtxoMerge(protocolParams, transferAmount, totalUtxos) {

	do {
		// in case of no suitable nft utxo
		let targetNftUtoxs = await selectBalanceNftUtxos(totalUtxos, transferAmount);
		// if (undefined !== targetNftUtoxs) {
		// 	let ret = await handleNftUtxosBalance(internalSignFunc, targetNftUtoxs, transferAmount);
		// 	if(undefined === ret){
		// 		throw "handle nft utxos merging failed for uniqueId: " + uniqueId;
		// 	}
		// }
		console.log("\n\n...selected Balance NftUtxos: ", targetNftUtoxs);

		let formatedUtxos = commonUtilObj.formatUtxoData(targetNftUtoxs);
		let ret = commonUtilObj.parseTreasuryNftUtxoChangeData(protocolParams, formatedUtxos, transferAmount, payAddress);
		console.log("\n\n...parseTreasuryNftUtxoChangeData ret: ", ret);
		console.log("\n\n...parseTreasuryNftUtxoChangeData outputNum: ", ret.outputNum);
		console.log("\n\n...parseTreasuryNftUtxoChangeData adaAmount: ", ret.adaAmount.to_str());
		console.log("\n\n...parseTreasuryNftUtxoChangeData marginAda: ", ret.marginAda.to_str());
		console.log("\n\n...parseTreasuryNftUtxoChangeData mergedBindAda: ", ret.mergedBindAda.to_str());
		console.log("\n\n...parseTreasuryNftUtxoChangeData changedBindAda: ", ret.changedBindAda.to_str());

		await commonUtilObj.sleep(10000);

	} while (true);
}


async function trigerNFTUtxoMerge(protocolParams, totalUtxos, transferAmount){

	let nftAmountObj = buildMultiNftAmount(transferAmount);

	await nftUtxoMerge(protocolParams, nftAmountObj, totalUtxos);

}


async function main() {
	let ogmiosInst = buildOgmiosService();

	// to get protocolParams
	let protocolParams = await ogmiosInst.getCurrentProtocolParameters();
	console.log("\n\n...getCurrentProtocolParameters ret: ", protocolParams);
	let minFeeA = JSON.stringify(protocolParams.minFeeCoefficient);
	let minFeeB = JSON.stringify(protocolParams.minFeeConstant);
	let coinsPerUtxoWord = JSON.stringify(protocolParams.coinsPerUtxoByte * 2);
	console.log("\n\n...coinsPerUtxoWord ret: ", coinsPerUtxoWord);
	console.log("...minFeeA ret: ", minFeeA);
	console.log("...minFeeB ret: ", minFeeB);

	// to get utxos by address
	let pageNumber = 1;
	let countNumber = 100;
	let order = 'asc';
	let ret = await ogmiosInst.getAddressUTXOs(payAddress, pageNumber, countNumber, order);
	let totalUtxos = ret.utxos;
	console.log("\n\n...getAddressUTXOs ret: ", totalUtxos);

	// let commonUtilObj = new CommonUtils("addr_test");
	let formatedUtxos = convertUtxosFormat(totalUtxos);
	for (let i = 0; i < formatedUtxos.length; i++) {
		let utxoItem = formatedUtxos[i];
		let utxoValue = utxoItem.value;

		let adaAmount = utxoValue.coins;
		let assetAmount = utxoValue.assets;
		console.log("\n\n...utxo id: ", i);
		console.log("...utxo ada: ", adaAmount);
		console.log("...utxo asset: ", assetAmount);
	}


	let transferAmount = {
		"5e4a2431a465a00dc5d8181aaff63959bb235d97013e7acb50b55bc4.4e6f646546656564": 2,
		"5e4a2431a465a00dc5d8181aaff63959bb235d97013e7acb50b55bc4.526577617264": 1,
		"5e4a2431a465a00dc5d8181aaff63959bb235d97013e7acb50b55bc4.4f7261636c6546656564": 1,
	};
	await trigerNFTUtxoMerge(protocolParams, formatedUtxos, transferAmount);




}

main()
