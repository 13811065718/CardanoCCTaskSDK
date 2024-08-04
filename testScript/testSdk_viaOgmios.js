
let plutusTxService = require("../plutusTxService");
let  CardanoClient = require("../../../../utils/cardano/client")

const Web3 = require("web3");
const web3 = new Web3();
const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');


async function internalSignFunc(dataArray, typeArray, redeemUtxo, dataHash){
	console.log("internalSignFunc() args.dataHash: ", dataHash, ", args.redeemUtxo: ", redeemUtxo);
	let signedTxData = "84a300828258201498a38b94513f51c80cb68b74f4f1ec86976910af039e16d90352880a542a46018258208f790c4e02e93406172046fe2f2a3d35d5f3c3c82078df088651fbf2fc2fa2ad010182a300581d708ada0cf9006de63c9542772f2d61a2f182b47ec91a10b75deddc4aa901821a05f6a450a0028201d81845d8799f01ff82583900a28ee8cb758d35772c49e4c791010470186733d1f78e09490663fe3e05ea0e64a98e634cb5ea1c5067abf87f9ce7003b3d610086a87c8fe21b000000042d919371021a00029519a10081825820785173044b87dbd34fa7ffb20aed3f586fdfdc88982073e6c61c0a8fdcb676ba584074735977682005527de18ba6a567ab5f457cacf1df58635930c044d50bcce7b8af7650887a62c18a82f32ddbb485bafec15828cce255d6218e5fd1c49e23100ff5f6";
	return signedTxData;
};

function _buildSmgTypeMeta() {
	/** add metadata ************************/
	const metaData = {
		"type": 2,
		"uniqueId": "0xf468acc06f286c1deaa718c1c24f8c7929e888340ebb88003cfb836683076827",
		"tokenPairID": 110
	};
	let metaDataObj = {"1": metaData };
	return metaDataObj;
}

async function main(){

	const scriptRefOwnerAddr = 'addr_test1vq73yuplt9c5zmgw4ve7qhu49yxllw7q97h4smwvfgst32qrkwupd';

	{
		const scAddress = plutusTxService.getLockerScAddress();
		console.log("scAddress: ", scAddress);
	}

	// let tokenId = 2;
	// let ret = (Array(63).fill('0').join("") + tokenId.toString(16)).slice(-64);
	// console.log("convert result: ", "0x"+ret);
	let ogmiosConfig = {
		"host": "http://52.13.9.234",
		"port": 4337
	}

	// let connectorInst = new ogmiosApi(ogmiosConfig);
	let connectorInst = new CardanoClient();
		connectorInst.init(true, {nodeUrl: ogmiosConfig.host + ":" + ogmiosConfig.port})

	let plutusTxSrvInst = new plutusTxService(connectorInst, scriptRefOwnerAddr, console);

	{
		const proofInfo = {
			to: 'addr_test1vpwpjy45nm9txk5622886qljhsdcukmklue3uk5urzuyhxquhu0t7',
			tokenId: '0x0000000000000000000000000000000000000000',
			amount: 0,
			adaAmount: 2088003,
			txHash: 'ed5b045cd5884684d462677082334b16d8a8457ed67665481d0d1af59efbe991',
			index: 0
		}
		let dataHash =  await plutusTxSrvInst.genRedeemProofHash(proofInfo);
		console.log("genRedeemProofHash() return dataHash: ", dataHash);
	}

	let basicArgs = {
		amount: 2000000,
		tokenAddr: "0x0000000000000000000000000000000000000000",
		paymentAddress: "addr_test1qz6twkzgss75sk379u0e27phvwhmtqqfuhl5gnx7rh7nux2xg4uwrhx9t58far8hp3a06hfdfzlsxgfrzqv5ryc78e4s4dwh26",
		paymentSKey: "cbc623254ca1eb30d8cb21b2ef04381372ff24529a74e4b5117d1e3bbb0f0188",
		crossAddress: "addr_test1qz6twkzgss75sk379u0e27phvwhmtqqfuhl5gnx7rh7nux2xg4uwrhx9t58far8hp3a06hfdfzlsxgfrzqv5ryc78e4s4dwh26",
		metaData: _buildSmgTypeMeta()
	};

	let chainID = 777;
	let hashKey = "91c715ef59821863889388a6210679a233069cbe2c91ba0b844cb85823713d85";
	let tokenPairID = '111';
	let amount = 2000000;
	let fee = 50000;
	let crossTokenAddr = "751de3af05b9899590940027da2c64647a8223c3607d32500c7bfee006ef9c42";
	let crossAddress = "addr_test1qz6twkzgss75sk379u0e27phvwhmtqqfuhl5gnx7rh7nux2xg4uwrhx9t58far8hp3a06hfdfzlsxgfrzqv5ryc78e4s4dwh26";

	// let signData = [web3.toBigNumber(chainID), hashKey, tokenPairID, amount, fee, crossTokenAddr, crossAddress];
	// let typesArray = ['uint', 'bytes32', 'uint', 'uint', 'uint', 'address', 'address'];
	let dataArray = new Array();
	dataArray.push(web3.utils.toBN(chainID));
	dataArray.push(hashKey);
	dataArray.push(tokenPairID);
	dataArray.push(amount);
	dataArray.push(fee);
	dataArray.push(crossTokenAddr);
	dataArray.push(crossAddress);

	let typeArray = new Array();
	typeArray.push('uint');
	typeArray.push('bytes32');
	typeArray.push('uint');
	typeArray.push('uint');
	typeArray.push('uint');
	typeArray.push('address');
	typeArray.push('address');

	let partialRedeemerArgs = {
		dataArray: dataArray,
		typeArray: typeArray
	}

	let signedTx = await plutusTxSrvInst.buildSignedTx(basicArgs, internalSignFunc, partialRedeemerArgs);
	console.log("buildSignedTx result: ", signedTx);
	console.log("buildSignedTx result (hex): ", signedTx.to_hex());
}


main()
