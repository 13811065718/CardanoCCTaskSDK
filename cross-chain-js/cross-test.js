const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
const utils = require('./utils');
const ogmiosUtils = require('./ogmios-utils');
const cbor = require('cbor-sync');
const contracts = require('./contracts');
const contractsMgr = require('./contracts-mgr');

const isMainnet = false
contracts.init(isMainnet);

const jsSHA = require("jssha");
const secp256k1 = require('secp256k1');
const { get32SchnorrVerificationKey, getSerialised64SchnorrVerificationKey, schnorrSign } = require('./schnorr');
let secp = require("@noble/secp256k1");
const { createScriptRef } = require('./utils');

const ADDR_PREFIX = 'addr_test1';

const payPrvKeyNext = '9b160ba482e38697c5631df832cbc2f5a9c41d9a588b2fa11dc7c370cf02058a';
const payPrvKey = 'cbc623254ca1eb30d8cb21b2ef04381372ff24529a74e4b5117d1e3bbb0f0188';
const scriptRefOwnerAddr = 'addr_test1vq73yuplt9c5zmgw4ve7qhu49yxllw7q97h4smwvfgst32qrkwupd';
const admin = 'addr_test1qz6twkzgss75sk379u0e27phvwhmtqqfuhl5gnx7rh7nux2xg4uwrhx9t58far8hp3a06hfdfzlsxgfrzqv5ryc78e4s4dwh26';
const adminNext = 'addr_test1qpewhjzf3nsh8ytwtkqewf0n8kkynxsva867stedemugsa5a5fxd4tcsgemc7gc4sqfww6f6s0rc45kcsjkd2wzxt2dqnhh2wl';


const paymentKey = '9b160ba482e38697c5631df832cbc2f5a9c41d9a588b2fa11dc7c370cf02058a'
const stakeKey = '9b160ba482e38697c5631df832cbc2f5a9c41d9a588b2fa11dc7c370cf02058a'
const psk = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(paymentKey, 'hex'));
const ssk = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(stakeKey, 'hex'));
const add = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet_preprod().network_id()
    , CardanoWasm.StakeCredential.from_keyhash(psk.to_public().hash())
    , CardanoWasm.StakeCredential.from_keyhash(ssk.to_public().hash()));

const aaa = add.to_address().to_bech32(ADDR_PREFIX);
console.log(aaa);

console.log(contractsMgr.StoremanStackScript.script().hash().to_hex(),
    contractsMgr.StoremanStackScript.address().to_bech32());
;
// {
//     const t = '84aa00838258206bfd36247fc3f3dc6cc205cf3465e27c32e0906fc41ea5e0b43fe2a86a4958170082582083b5a9633b9cbd9384e331d326183a5ed56d2d2bda78b5df8ae5312f2283110802825820aab496318c4d43dc4a6d1ed6ab0cab3c57827ff99afe840c2b620e28bc19b61b000183a3005839318d4c43c5a72fe731513ebecf5f44d717164d254e08eb4a57ee234bb7259b187aa287258c0b95e636a472391282dedb2eb17b8bf321bb14f101821a00129c92a1581c526d246045bf4a66ae86fd7a9985a91ef3752113f9daa9060bb54be6a14a54436865636b436f696e01028201d81845d8799f01ff82583901e6da7b55ab70b0eef4154bc2d8cd80f4b504cf921f985512093d660aca6e70d3cead51d65be7fd05f5901d60080d29d2dbd3da61e728d8b8821a00124864a1581cfb0e9a083ac66c814548002cbdfc54557e064e4cdf5c6675e72d22b4a1444445414e18638258390134c4f8796f4fbde6028dd507fb76ff7affa7f0ea17dcdf38fcc75eb834c4f8796f4fbde6028dd507fb76ff7affa7f0ea17dcdf38fcc75eb8821a033392d0a1581cfb0e9a083ac66c814548002cbdfc54557e064e4cdf5c6675e72d22b4a1444445414e01021a00053f37031a06ba242707582081c310357d2abd456e301d3fdce5e845247649fc5e09c7802de2ec3f46bf06290b5820b3a4bc9dbd6bf068be5111558cbaecf07d3ef509295ccdc0a0f6b506711902500d8182582083b5a9633b9cbd9384e331d326183a5ed56d2d2bda78b5df8ae5312f2283110802108258390134c4f8796f4fbde6028dd507fb76ff7affa7f0ea17dcdf38fcc75eb834c4f8796f4fbde6028dd507fb76ff7affa7f0ea17dcdf38fcc75eb81a032eb4e1111a000a1d261285825820aab496318c4d43dc4a6d1ed6ab0cab3c57827ff99afe840c2b620e28bc19b61b00825820a18c4e8aa42dae5c6054071f7fa1b3e1240f47e89dab16185340338bb248148e0082582017226b6644d8e9ef749026da6af4a17608b9e1fe2cf073bf6f3d5d9a8fdad58e008258206bfd36247fc3f3dc6cc205cf3465e27c32e0906fc41ea5e0b43fe2a86a495817008258203486b67b30e78a5114ef0ec78c3af776f95dc5b1342adca74d6931308bef128100a3008182582005375501168efcc32a1c173f4c371b658001ae171e7303f8be76bca3688b7023584019da39070c2f9b3118cd2a40ecde928301939f5e18ad6c494720780931d61f2525d7a52a666c1c5fed988afcb46bd98434ed0562efd3b9d8973013aba9aa340c03800582840002d87a9fd8799f581ce6da7b55ab70b0eef4154bc2d8cd80f4b504cf921f985512093d660a581cca6e70d3cead51d65be7fd05f5901d60080d29d2dbd3da61e728d8b8581cfb0e9a083ac66c814548002cbdfc54557e064e4cdf5c6675e72d22b4444445414e18631a001248645820aab496318c4d43dc4a6d1ed6ab0cab3c57827ff99afe840c2b620e28bc19b61b00005820ef198b4fac502861e86b0b5f060c88f06c065fb860a60b9a43ef49d9e9e363d2001b0000018cd7db8890005840b26171d52a11c5bccc06bbfa76998f24f4a6489e3d442ffb9cd580835f7fb40d5bbe7a36d7c3dc4b4f73a9c29797ead293429ff7552ad59c2c2bc96c547a2206ffff821a000c6b901a1cc7a85b840000d87980821a000c275c1a035dc7c2f5a101a36b746f6b656e50616972494419029064747970650268756e6971756549645820ef198b4fac502861e86b0b5f060c88f06c065fb860a60b9a43ef49d9e9e363d2';
//     const tttt = CardanoWasm.Transaction.from_hex(t);
//     console.log(tttt.to_json());
// }

// const payPrvKey = '9b160ba482e38697c5631df832cbc2f5a9c41d9a588b2fa11dc7c370cf02058a';
// const payPrvKeyNext = 'cbc623254ca1eb30d8cb21b2ef04381372ff24529a74e4b5117d1e3bbb0f0188';
// const scriptRefOwnerAddr = 'addr_test1vq73yuplt9c5zmgw4ve7qhu49yxllw7q97h4smwvfgst32qrkwupd';
// const adminNext = 'addr_test1qz6twkzgss75sk379u0e27phvwhmtqqfuhl5gnx7rh7nux2xg4uwrhx9t58far8hp3a06hfdfzlsxgfrzqv5ryc78e4s4dwh26';
// const admin = 'addr_test1qpewhjzf3nsh8ytwtkqewf0n8kkynxsva867stedemugsa5a5fxd4tcsgemc7gc4sqfww6f6s0rc45kcsjkd2wzxt2dqnhh2wl';

console.log('admin PK:', CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().to_hex());
console.log('admin PKH:', CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash().to_hex());

let protocolParamsGlobal = {};
let utxosForFee = []




const groupInfoParams = {
    [contractsMgr.GroupNFT.Version + '']: contractsMgr.GroupInfoNFTHolderScript.script().hash().to_hex(),
    [contractsMgr.GroupNFT.Admin + '']: contractsMgr.AdminNFTHolderScript.script().hash().to_hex(),//CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash().to_hex(),
    [contractsMgr.GroupNFT.GPK + '']: Buffer.from(get32SchnorrVerificationKey(payPrvKey)).toString('hex'),
    [contractsMgr.GroupNFT.BalanceWorker + '']: CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash().to_hex(),
    [contractsMgr.GroupNFT.TreasuryCheckVH + '']: contracts.TreasuryCheckScript.script().hash().to_hex(),
    [contractsMgr.GroupNFT.OracleWorker + '']: CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash().to_hex(),
    [contractsMgr.GroupNFT.MintCheckVH + '']: contracts.MintCheckScript.script().hash().to_hex(),
    [contractsMgr.GroupNFT.StkVh + '']: contractsMgr.StoremanStackScript.script().hash().to_hex(),
    [contractsMgr.GroupNFT.StkCheckVh + '']: contractsMgr.StakeCheckScript.script().hash().to_hex(),
}

const TreasuryScriptAddress = contracts.TreasuryScript.address(groupInfoParams[contractsMgr.GroupNFT.StkVh]);
console.log(contractsMgr.StoremanStackScript.address().to_bech32());

const groupInfoParamsNext = {
    groupInfoPk: Buffer.from(get32SchnorrVerificationKey(payPrvKeyNext)).toString('hex'),//CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKeyNext, 'hex')).to_public().to_hex(),
    adminPKH: CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKeyNext, 'hex')).to_public().hash().to_hex()
}

const addr = CardanoWasm.EnterpriseAddress.new(2, CardanoWasm.StakeCredential.from_keyhash(
    CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash()
));

console.log('addr=', addr.to_address().to_bech32(ADDR_PREFIX));

/**
 * 
 * @param {*} hash 
 * @returns {Object} vkey: the verify key (public key),signature: the signature
 * }
 */
const signFn = async hash => {
    return ogmiosUtils.signFn(payPrvKey, hash);
}

const evaluate = async function (rawTx) {
    // console.log('\n\n\n',rawTx,'\n\n\n');
    return await ogmiosUtils.evaluateTx(CardanoWasm.Transaction.from_hex(rawTx));
}



async function tryScriptRefUtxo(script) {
    // console.log(script.to_hex());
    let refUtxo = await ogmiosUtils.getUtxo(scriptRefOwnerAddr);
    // const arr = refUtxo.filter(o => script.to_hex().indexOf(o.script['plutus:v2']) >= 0);
    const ref = refUtxo.find(o => {
        // console.log(o.script['plutus:v2'].slice(0,6));
        return script.to_hex().indexOf(o.script['plutus:v2']) >= 0
    });
    if (ref) return ref;

    let utxtos = await getUtxoForFee();

    let signedTx = await utils.createScriptRef(protocolParamsGlobal, utxtos, admin, scriptRefOwnerAddr, script, signFn);
    // console.log(signedTx.to_json());
    const ret = await ogmiosUtils.submitTx(signedTx);
    // console.log('create script ref:', ret)
    return await ogmiosUtils.waitTxConfirmed(scriptRefOwnerAddr, ret);
}

console.log(
    Buffer.from(get32SchnorrVerificationKey(payPrvKey)).toString('hex'), '\n',
    CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().to_hex(), '\n',
    Buffer.from(secp256k1.publicKeyCreate(Buffer.from(payPrvKey, 'hex'), false)).toString('hex'), '\n',
    Buffer.from(secp.getPublicKey(payPrvKey)).toString('hex'), '\n'

)
// const Fake_Token_Name = 'abc'
// const Fake_Token_Name = 'COCK';
// const Fake_Token_Name = Buffer.from('0014df104e494e4a415a','hex');//'NINJAZ';
// const Fake_Token_Name = 'Louey';
// const Fake_Token_Name = 'TADA';
// const Fake_Token_Name = 'HOSKY';
// const Fake_Token_Name = 'DEAN';
// const Fake_Token_Name = Buffer.from('0014df10536861726473', 'hex');
// const Fake_Token_Name = 'worldmobiletoken';
// const totalSupplyOfFackToken = '2000000000000000';
// const Fake_Token_Name = 'PAVIA';
// const totalSupplyOfFackToken = '2000000000';
const Fake_Token_Name = 'CATSKY';
const totalSupplyOfFackToken = '999999999997';

const assetName = CardanoWasm.AssetName.new(Buffer.from(Fake_Token_Name, 'utf-8'));
console.log(assetName.to_hex());

;

const bigN = CardanoWasm.BigNum.max_value();//from_str('99687000000000000000000');
// const bigN = CardanoWasm.BigInt.from_str('996870000000000000000000000');
console.log(bigN.to_json());

const dd = '0014df10 4e494e4a415a';
// 343ac71f7f3b2dbd4efa1e9735c2ac2cb7ae777d5325db23d9f77332.4e494e4a415a

async function mintFakeToken(to) {
    const tmp = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('0'));

    const bigN = CardanoWasm.BigNum.max_value();//from_str('99687000000000000000000');
    // const bigN = CardanoWasm.BigInt.from_str('996870000000000000000000000');
    console.log(bigN.to_json());
    // CardanoWasm.Assets.new().insert()
    const pubKh = CardanoWasm.BaseAddress.from_address(CardanoWasm.Address.from_bech32(admin)).payment_cred().to_keyhash().to_hex();;
    const utxosForFee = await getUtxoForFee();
    const collateralUtxo = await tryGetCollateralUtxo();
    // const to = 'addr_test1qqyaa3ev62349hv65xv5fx475yfj7d62vs68g7886tj7397ng0vl8m0gl4q6yla5tplxupnxfywn9ntrrff7smaqrahqzfputv';
    const mintAmount = totalSupplyOfFackToken;//'525000000001';//'1000000000000001';
    const signTx = await contracts.FakeToken.mint(protocolParamsGlobal, utxosForFee, [collateralUtxo], pubKh, to, Fake_Token_Name, mintAmount, undefined, signFn);
    console.log(signTx.to_json());
    await ogmiosUtils.evaluateTx(signTx);
    let txHash = await ogmiosUtils.submitTx(signTx);
    let o = await ogmiosUtils.waitTxConfirmed(admin, txHash);
}

// async function genCheckUtxo(owner) {


//     let utxosForFee = await getUtxoForFee();

//     const minAda = utils.getMinAdaOfUtxo(protocolParamsGlobal, owner, { coins: 1000000 }, utils.genDemoDatum42());
//     const signedTx = await utils.transfer(protocolParamsGlobal, utxosForFee, owner, { coins: minAda, assets: {} }, admin, utils.genDemoDatum42(), undefined, signFn);

//     const txHash = await ogmiosUtils.submitTx(signedTx);
//     const treasuryChecker = contracts.TreasuryCheckScript.address().to_bech32(ADDR_PREFIX);
//     const o = await ogmiosUtils.waitTxConfirmed(treasuryChecker, txHash);

//     const utxoRet = await ogmiosUtils.getUtxo(treasuryChecker);

//     return utxoRet.find(o => o.txHash == txHash);
// }

function getCheckTokenClass(owner) {
    let contractClass;
    const hash = utils.addressToPkhOrScriptHash(owner);
    switch (hash) {
        case contracts.TreasuryCheckScript.script().hash().to_hex():
            contractClass = contracts.TreasuryCheckTokenScript;
            break;
        case contracts.MintCheckScript.script().hash().to_hex():
            contractClass = contracts.MintCheckTokenScript;
            break;
        default:
            break;
    }
    return contractClass;
}

const mustSignBy = [CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash().to_hex()];
async function mintCheckToken(mintTo, amount = 1) {
    const groupInfoUtxo = await getGroupInfoToken();
    console.log(`GroupInfo  utxo: ${groupInfoUtxo.txHash + '#' + groupInfoUtxo.index}`);
    const contractClass = getCheckTokenClass(mintTo);
    console.log(contractClass.tokenId());
    let utxosForFee = await getUtxoForFee();
    const utxosCollateral = await tryGetCollateralUtxo();
    const scriptRefUtxo = await tryScriptRefUtxo(contractClass.script());

    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const signedTx = await contractClass.mint(protocolParamsGlobal, utxosForFee, [utxosCollateral], scriptRefUtxo, groupInfoUtxo, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, admin, amount, mintTo, signFn);
    console.log(signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(JSON.stringify(ret));
    const txHash = await ogmiosUtils.submitTx(signedTx);
    // const treasuryChecker = contracts.MintCheckScript.address().to_bech32(ADDR_PREFIX);
    const o = await ogmiosUtils.waitTxConfirmed(mintTo, txHash);

    const utxoRet = await ogmiosUtils.getUtxo(mintTo);

    return utxoRet.find(o => o.txHash == txHash && o.value.assets[contractClass.tokenId()] * 1 > 0);
}

function getAdminInfo() {
    const signatories = [
        CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash().to_hex(),
        CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKeyNext, 'hex')).to_public().hash().to_hex()
    ]
    const datum = contractsMgr.AdminNFTHolderScript.genDatum(signatories, 1);
    return { owner: contractsMgr.AdminNFTHolderScript.address().to_bech32(ADDR_PREFIX), datum };
}

async function mintAdminNft() {
    const adminNFTRef = await tryScriptRefUtxo(contractsMgr.AdminNFT.script());
    console.log(`GroupInfo ref utxo: ${adminNFTRef.txHash + '#' + adminNFTRef.index}`);

    let utxosForFee = await getUtxoForFee();
    const parameterizeUtxo2 = await getUtxoOfAmount(parameterizedAmount2);
    utxosForFee = utxosForFee.concat(parameterizeUtxo2);
    const utxosCollateral = await tryGetCollateralUtxo();

    const mintParams = getAdminInfo();

    const signedTx = await contractsMgr.AdminNFT.mint(protocolParamsGlobal, utxosForFee, [utxosCollateral], adminNFTRef, admin, mintParams, signFn);
    console.log(signedTx.to_json());
    await ogmiosUtils.evaluateTx(signedTx);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const adminNftHolder = contractsMgr.AdminNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    const o = await ogmiosUtils.waitTxConfirmed(adminNftHolder, txHash);

    const adminNft = await ogmiosUtils.getUtxo(adminNftHolder);
    console.log('Mint adminNFT:', o);
    return adminNft.find(o => o.txHash == txHash);
}

async function mintGroupInfoToken() {
    const groupInfoRef = await tryScriptRefUtxo(contractsMgr.GroupNFT.script());
    console.log(`GroupInfo ref utxo: ${groupInfoRef.txHash + '#' + groupInfoRef.index}`);

    let utxosForFee = await getUtxoForFee();
    const parameterizeUtxo = await getUtxoOfAmount(parameterizedAmount);
    utxosForFee = utxosForFee.concat(parameterizeUtxo);
    const utxosCollateral = await tryGetCollateralUtxo();

    const signedTx = await contractsMgr.GroupNFT.mint(protocolParamsGlobal, utxosForFee, [utxosCollateral], groupInfoRef, groupInfoParams, admin, undefined, signFn);
    // console.log('================================================================');
    // console.log(signedTx.to_json());
    // console.log('================================================================')
    await ogmiosUtils.evaluateTx(signedTx);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const groupInfoHolder = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolder, txHash);

    const groupInfoToken = await ogmiosUtils.getUtxo(groupInfoHolder);
    console.log('Mint groupNFT:', o);
    return groupInfoToken.find(o => o.txHash == txHash);
}

const collateralAmount = 123450000
const parameterizedAmount = 5678900;
const parameterizedAmount2 = 5600000

async function getUtxoOfAmount(amount) {
    let utxos = await ogmiosUtils.getUtxo(admin);
    utxos = utxos.filter(o => {
        return (Object.keys(o.value.assets).length <= 0) && (o.value.coins * 1 == amount * 1)
    });
    return utxos;
}

async function getUtxoForFee() {
    let utxos = await ogmiosUtils.getUtxo(admin);
    utxos = utxos.filter(o => {
        return (o.value.coins * 1 != collateralAmount && o.value.coins * 1 != parameterizedAmount && o.value.coins * 1 != parameterizedAmount2)
    });
    return utxos.slice(0, 2);
}

async function makeUtxoOfAmount(amount) {
    let utxosForFee = await getUtxoForFee();

    const signedTx = await utils.transfer(protocolParamsGlobal, utxosForFee, admin, { coins: amount }, admin, undefined, undefined, signFn);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(admin, txHash);

    return o;//await getUtxoOfAmount(amount);
}

async function tryGetCollateralUtxo() {
    let utxo = await getUtxoOfAmount(collateralAmount);
    if (utxo.length <= 0) {
        utxo = await makeUtxoOfAmount(collateralAmount);
    } else {
        utxo = utxo[0];
    }
    return utxo;
}

async function tryGetParameterizedRefUtxo() {

    let utxo = await getUtxoOfAmount(parameterizedAmount);
    if (utxo.length <= 0) {
        utxo = await makeUtxoOfAmount(parameterizedAmount);
    } else {
        utxo = utxo[0];
    }

    if (utxo) {
        const nonce = Buffer.from(utxo.txHash, 'hex');
        let aa = '';
        nonce.forEach(value => {
            let tmp = '0' + value.toString(16);
            aa = aa + '0x' + tmp.slice(tmp.length - 2) + ',';
        });
        if (utxo.index != 1) {
            console.warn('ParameterizedRefUtxo index is:', utxo.index);
        }
        console.log(aa);
    }
    return utxo;
}

async function tryGetParameterizedRefUtxo2() {

    let utxo = await getUtxoOfAmount(parameterizedAmount2);
    if (utxo.length <= 0) {
        utxo = await makeUtxoOfAmount(parameterizedAmount2);
    } else {
        utxo = utxo[0];
    }

    if (utxo) {
        const nonce = Buffer.from(utxo.txHash, 'hex');
        let aa = '';
        nonce.forEach(value => {
            let tmp = '0' + value.toString(16);
            aa = aa + '0x' + tmp.slice(tmp.length - 2) + ',';
        });
        if (utxo.index != 1) {
            console.warn('ParameterizedRefUtxo2 index is:', utxo.index);
        }
        console.log(aa);
    }
    return utxo;
}

async function getAdminNft() {
    const adminNftHolder = contractsMgr.AdminNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    const tmp = CardanoWasm.EnterpriseAddress.from_address(contractsMgr.AdminNFTHolderScript.address()).payment_cred().to_scripthash().to_hex()
    console.log('AdminNFTHolderScript hash', tmp);
    const adminNftUtxo = (await ogmiosUtils.getUtxo(adminNftHolder)).find(o => {
        for (const tokenId in o.value.assets) {
            if (tokenId == contractsMgr.AdminNFT.tokenId()) return true;
        }
        return false;
    });

    return adminNftUtxo;
}

async function getGroupInfoToken() {
    const groupInfoHolder = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    const tmp = CardanoWasm.EnterpriseAddress.from_address(contractsMgr.GroupInfoNFTHolderScript.address()).payment_cred().to_scripthash().to_hex()
    console.log('GroupInfoNFTHolderScript hash', tmp);
    const groupInfoToken = (await ogmiosUtils.getUtxo(groupInfoHolder)).find(o => {
        for (const tokenId in o.value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    return groupInfoToken;
}

async function getCheckUtxo(owner) {

    let treasuryUtxos = await ogmiosUtils.getUtxo(owner);
    const tokenId = getCheckTokenClass(owner).tokenId();
    treasuryUtxos = treasuryUtxos.filter(o => (o.value.assets && o.value.assets[tokenId] * 1 > 0) ? false : true)

    return treasuryUtxos.length > 0 ? treasuryUtxos[0] : undefined;
}

async function getCheckTokenUtxo(owner) {
    let treasuryUtxos = await ogmiosUtils.getUtxo(owner);
    const tokenId = getCheckTokenClass(owner).tokenId();
    treasuryUtxos = treasuryUtxos.filter(o =>
        (o.value.assets && o.value.assets[tokenId] * 1 > 0))


    return treasuryUtxos.length > 0 ? treasuryUtxos[treasuryUtxos.length - 1] : undefined;
}

async function getTreasuryUtxo(amount, tokenId = '') {
    const shouldDatum = utils.datum42().to_hex();
    let treasuryUtxo = await ogmiosUtils.getUtxo(TreasuryScriptAddress.to_bech32(ADDR_PREFIX));
    // return treasuryUtxo;
    treasuryUtxo = treasuryUtxo.filter(o => {

        if (!o.datum) return false;
        if (tokenId == '') {
            if (o.value.assets && Object.keys(o.value.assets).length > 0) return false;
            return true;
        } else {
            if ((o.value.assets && o.value.assets[tokenId])) return true;
            return false;
        }
    });

    if (amount == 0) return treasuryUtxo;

    let sum = 0;
    for (let i = 0; i < treasuryUtxo.length; i++) {
        const o = treasuryUtxo[i];
        if (tokenId == '' && (o.value.assets || Object.keys(o.value.assets).length <= 0)) {
            sum = sum + o.value.coins * 1;
        } else {
            if (o.value.assets[tokenId]) sum = sum + o.value.assets[tokenId] * 1;
        }
        if (sum * 1 >= amount * 1) {
            treasuryUtxo = treasuryUtxo.slice(0, i + 1);
            break;
        }
    }
    let totalAmount = 0;
    for (let i = 0; i < treasuryUtxo.length; i++) {
        const utxo = treasuryUtxo[i];
        if (tokenId == '') {
            totalAmount += utxo.value.coins * 1;
        } else {
            totalAmount += utxo.value.assets[tokenId] * 1;
        }
    }
    if (totalAmount < amount) return [];

    return treasuryUtxo;
}

async function getMappingTokenUtxo(addr, tokenName, amount) {
    // const address = CardanoWasm.Address.from_bech32(addr);
    let mappingTokenUtxo = await ogmiosUtils.getUtxo(addr);
    const tokenId = contracts.MappingTokenScript.tokenId(tokenName);
    mappingTokenUtxo = mappingTokenUtxo.filter(o => {
        return o.value.assets[tokenId] != undefined;//&& (o.datum.indexOf(shouldDatum) > 0)
    });

    let sum = 0;
    for (let i = 0; i < mappingTokenUtxo.length; i++) {
        const o = mappingTokenUtxo[i];
        sum = sum + o.value.assets[tokenId] * 1;
        if (sum * 1 >= amount * 1) {
            mappingTokenUtxo = mappingTokenUtxo.slice(0, i + 1);
        }
    }
    let totalAmount = 0;
    for (let i = 0; i < mappingTokenUtxo.length; i++) {
        const utxo = mappingTokenUtxo[i];
        totalAmount += utxo.value.assets[tokenId] * 1;
    }
    if (totalAmount < amount) return [];
    return mappingTokenUtxo;
}

async function crossMint(to, tokenName, amount, mode = 1) {
    const mappingTokenScriptRef = await tryScriptRefUtxo(contracts.MappingTokenScript.script());
    console.log(`mappingTokenScript ref utxo: ${mappingTokenScriptRef.txHash + '#' + mappingTokenScriptRef.index}`);

    const mintCheckScriptRef = await tryScriptRefUtxo(contracts.MintCheckScript.script());
    console.log(`mintCheckScript ref utxo: ${mintCheckScriptRef.txHash + '#' + mintCheckScriptRef.index}`);

    const mintCheckAddr = contracts.MintCheckScript.address().to_bech32(ADDR_PREFIX);
    let mintCheckUxto = await getCheckUtxo(mintCheckAddr);
    if (!mintCheckUxto) {
        mintCheckUxto = await mintCheckToken(mintCheckAddr);
    }

    // let utxosForFee = await getUtxoForFee();

    const md = {
        "type": 2,
        "uniqueId": "0xf468acc06f286c1deaa718c1c24f8c7929e888340ebb88003cfb836683076827",
        "tokenPairID": 111
    };
    const metaData = { "1": md };

    const utxosCollateral = await tryGetCollateralUtxo();
    console.log('Collateral utxo', utxosCollateral);

    const utxosForFee = await getUtxoForFee();
    const nonce = { txHash: mintCheckUxto.txHash, index: mintCheckUxto.index };
    const redeemerProof = {
        to, tokenId, amount, txHash: nonce.txHash, index: nonce.index, mode
        , uniqueId: '1234567890123456789012345678901212345678901234567890123456789012'
        , signature: ''
    };

    const redeemProofHash = contracts.MintCheckScript.caculateRedeemDataHash(redeemerProof);

    const redeemerD = contracts.MintCheckScript.redeemProof(redeemerProof);
    const retdd = contracts.MintCheckScript.getRedeemerFromCBOR(redeemerD.to_hex());
    console.log(retdd);

    switch (mode) {
        case contracts.TreasuryScript.MODE_SCHNORR340:
            {
                const signature = await schnorrSign(redeemProofHash)(payPrvKey);//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature).toString('hex');
                break;
            }
        case contracts.TreasuryScript.MODE_ECDSA:
            {
                const signature = await secp256k1.ecdsaSign(
                    Buffer.from(redeemProofHash, 'hex'), Buffer.from(payPrvKey, 'hex'));//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature.signature).toString('hex');
                break;
            }
        case contracts.TreasuryScript.MODE_ED25519:
            {
                const { signature } = await signFn(redeemProofHash);
                redeemerProof.signature = signature;
                break;
            }
        default:
            throw 'bad signature mode';
    }


    // const groupInfoHolder = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    const groupInfoToken = await getGroupInfoToken();
    const ttl = await ogmiosUtils.getLastestSolt() + 1000;
    const signedTxOutBound = await contracts.MappingTokenScript.mint(
        protocolParamsGlobal, utxosForFee, [utxosCollateral], mappingTokenScriptRef
        , mintCheckScriptRef, mintCheckUxto, redeemerProof, admin, signFn,
        metaData, ttl, 1);
    console.log(signedTxOutBound.to_json());
    // console.log(signedTxOutBound.to_hex());
    const ret = await ogmiosUtils.evaluateTx(signedTxOutBound);
    console.log(ret);
    const txHashOutBound = await ogmiosUtils.submitTx(signedTxOutBound);
    const r = await ogmiosUtils.waitTxConfirmed(to, txHashOutBound);
    console.log('Transfer outBound successful:', JSON.stringify(r));

}

async function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time)
    })
}

async function crossTransfer(to, tokenId, amount, adaAmount, mode = 1) {
    const treasuryRef = await tryScriptRefUtxo(contracts.TreasuryScript.script());
    console.log(`Treasury ref utxo: ${treasuryRef.txHash + '#' + treasuryRef.index}`);

    const treasuryCheckRef = await tryScriptRefUtxo(contracts.TreasuryCheckScript.script());
    console.log(`treasuryCheckRef ref utxo: ${treasuryCheckRef.txHash + '#' + treasuryCheckRef.index}`);

    const treasuryCheckAddr = contracts.TreasuryCheckScript.address(groupInfoParams[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
    let treasuryCheckUxto = await getCheckTokenUtxo(treasuryCheckAddr);
    if (!treasuryCheckUxto) {
        treasuryCheckUxto = await mintCheckToken(treasuryCheckAddr, 5);
    }

    let utxosForFee = await getUtxoForFee();
    const transferValue = { coins: adaAmount, assets: tokenId ? { [tokenId]: amount } : {} };
    const Multiple = 2;
    const crossV = tokenId == '' ? adaAmount : amount;
    let treasuryUtxo = await getTreasuryUtxo(crossV * Multiple, tokenId);
    let treasuryUtxoTotalValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('0'));
    for (let i = 0; i < treasuryUtxo.length; i++) {
        const utxo = treasuryUtxo[i];
        treasuryUtxoTotalValue = treasuryUtxoTotalValue.checked_add(utils.funValue(utxo.value));
    }

    // {
    //     const transferValue = { coins: adaAmount, assets: tokenId ? { [tokenId]: amount } : {} };
    //     const signedTxInBound = await contracts.TreasuryScript.sendFunToTreasury(protocolParamsGlobal, utxosForFee, transferValue, admin, signFn, metaData, groupInfoParams, 1);
    //     console.log('Transfer inBound:', signedTxInBound.to_json());
    //     const txHashInBound = await ogmiosUtils.submitTx(signedTxInBound);
    //     const o = await ogmiosUtils.waitTxConfirmed(TreasuryScriptAddress.to_bech32(ADDR_PREFIX), txHashInBound);
    //     console.log('Transfer inBound successful:', JSON.stringify(o));
    // }

    const md = {
        "type": 1,
        "uniqueId": "0xf468acc06f286c1deaa718c1c24f8c7929e888340ebb88003cfb836683076827",
        "tokenPairID": 110,
        "toAccount": "addr_test1wqmpwrh2mlqa04e2mf3vr8w9rjt9du0dpnync8dzc85spgsya8emz", //对端的账号，
        "smgID": "123",
        "fee": 10
    };

    const metaData = { "1": md };//genMetaData({ type: '111', tokenPairID: '222', uniqueId: '333' })
    console.log('metaData = ', metaData);
    // while (treasuryUtxo.length <= 0) {
    //     const transferValue = { coins: adaAmount * 1, assets: tokenId ? { [tokenId]: amount } : {} };
    //     const signedTxInBound = await contracts.TreasuryScript.sendFunToTreasury(protocolParamsGlobal, utxosForFee, transferValue, admin, signFn, metaData);
    //     console.log('Transfer inBound:', JSON.stringify(transferValue));
    //     const txHashInBound = await ogmiosUtils.submitTx(signedTxInBound);
    //     const o = await ogmiosUtils.waitTxConfirmed(TreasuryScriptAddress.to_bech32(ADDR_PREFIX), txHashInBound);
    //     console.log('Transfer inBound successful:', JSON.stringify(o));
    //     treasuryUtxo = await getTreasuryUtxo(adaAmount * Multiple,tokenId);
    // }
    try {
        if (tokenId != '') {
            // treasuryUtxoTotalValue.set_coin(CardanoWasm.BigNum.from_str('0'));
        }
        console.log('===|||-->', treasuryUtxoTotalValue.to_json());
        console.log('===|||-->2', utils.funValue(transferValue).to_json());
        const changeValue = treasuryUtxoTotalValue.checked_sub(utils.funValue(transferValue));
        console.log('treasury is sufficent:', changeValue.to_json());
        // throw 'dd'
    } catch (error) {
        const minAda = utils.getMinAdaOfUtxo(protocolParamsGlobal, to, { coins: adaAmount, assets: tokenId ? { [tokenId]: amount } : {} });
        const transferValue = { coins: adaAmount * Multiple, assets: tokenId ? { [tokenId]: amount * Multiple } : {} };
        const signedTxInBound = await contracts.TreasuryScript.sendFunToTreasury(protocolParamsGlobal, utxosForFee, transferValue, admin, signFn, metaData, groupInfoParams, Multiple);
        console.log('Transfer inBound:', signedTxInBound.to_json());
        const txHashInBound = await ogmiosUtils.submitTx(signedTxInBound);
        const o = await ogmiosUtils.waitTxConfirmed(TreasuryScriptAddress.to_bech32(ADDR_PREFIX), txHashInBound);
        console.log('Transfer inBound successful:', JSON.stringify(o));
    }


    console.log('Transfer outBound:', JSON.stringify(transferValue));

    const utxosCollateral = await tryGetCollateralUtxo();
    console.log('Collateral utxo', utxosCollateral);

    utxosForFee = await getUtxoForFee();
    treasuryUtxo = await getTreasuryUtxo(crossV * Multiple, tokenId);
    // treasuryUtxo= treasuryUtxo.filter(o=>o.txHash== '59607ecf63065e196510f742d46271a2caf4262cf2cec84bbcb6e3d4427f1b8b');
    // treasuryUtxo = treasuryUtxo.filter(o=>o.value.assets && o.value.assets[tokenId]);

    // treasuryUtxo = treasuryUtxo.slice(0,2);

    let totalAdaAmount = 0;
    let totalAmount = 0;
    treasuryUtxo.forEach(o => {
        totalAdaAmount += o.value.coins * 1
        if (o.value.assets && o.value.assets[tokenId]) {
            totalAmount += o.value.assets[tokenId] * 1;
        }
    });

    let txType = contracts.TreasuryScript.CROSSTX;
    let outputCount = 0;
    if (to == TreasuryScriptAddress.to_bech32(ADDR_PREFIX)) {
        amount = totalAmount;
        adaAmount = totalAdaAmount;
        txType = contracts.TreasuryScript.BALANCETX;
    }


    const nonce = { txHash: treasuryCheckUxto.txHash, index: treasuryCheckUxto.index };
    const txTtl = await ogmiosUtils.getLastestSolt() + 1000;
    const ttl = Math.floor(await ogmiosUtils.currentNetworkSlotToTimestamp(txTtl));
    // const ttl = Math.floor(Date.now()/1000 + 200);


    try {
        let treasuryUtxoTotalValue2 = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('0'));
        for (let i = 0; i < treasuryUtxo.length; i++) {
            const utxo = treasuryUtxo[i];
            treasuryUtxoTotalValue2 = treasuryUtxoTotalValue2.checked_add(utils.funValue(utxo.value));
        }
        const change2 = treasuryUtxoTotalValue2.checked_sub(utils.funValue(transferValue));
        if (!change2.is_zero()) {
            outputCount = 1;
        }

        if (to == TreasuryScriptAddress.to_bech32(ADDR_PREFIX)) {
            outputCount = 1;
        }

    } catch (error) {

    }

    let userData;
    const addressType = utils.addressType(to);
    /*
        uniqueId :: BuiltinByteString
        -- crossInfo
        inPairId :: Integer
        outPairId :: Integer
        receiver :: BuiltinByteString
        -- tokenInfo
        feeADA :: Integer
        inToken :: BuiltinByteString
        inTokenMode :: Bool
        outToken :: BuiltinByteString
        outTokenMode :: Bool -- True: EVM MappingToken False: Cardano native token
        constraintCBOR :: BuiltinByteString
        -- inTokenAmount ::Integer
        -- outTokenAmountMin :: Integer
    */
    if (addressType == CardanoWasm.StakeCredKind.Script) {
        // userData = utils.genSwapContraitCDatum(1000000, 200000).to_hex();//utils.genDemoDatum42().to_hex();
        // console.log('userData:',userData);
        const info = {
            uniqueId: 'f468acc06f286c1deaa718c1c24f8c7929e888340ebb88003cfb836683076827',
            inPairId: 1,
            outPairId: 2,
            receiver: '313aaB7Dd0ea7709D908d9c68e5527c80aCd356a',
            feeADA: 3000000,
            inToken: '',
            inTokenMode: '',
            outToken: '',
            outTokenMode: '',
            constraintCBOR: utils.genSwapContraitCDatum(1000000, 200000).to_hex()
        }
        // userData = utils.genCrossDatum(info).to_hex();

        userData = 'd8799fd8799fd8799f581c2b709ff25223e209e11e8b9cc9f02ee4d185c3a1abfbba1c9cc2faa8ffd8799fd8799fd8799f581c6103000c99a2e1e2b3d78359410966fbb87a44d957172afdd6c4c0a5ffffffff581ce16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72434d494eff';
        // userData = CardanoWasm.PlutusData.from_hex(userData);
        // console.log(userData.to_json());
        // userData = userData.to_hex();
    }

    const redeemerProof = {
        to, tokenId, amount, adaAmount, txHash: nonce.txHash, index: nonce.index, mode
        , uniqueId: '1234567890123456789012345678901212345678901234567890123456789012'
        , txType, signature: '', ttl, outputCount, userData, pk: groupInfoParams.groupInfoPk
    };

    const redeemProofHash = contracts.TreasuryScript.caculateRedeemDataHash(redeemerProof);

    // const redeemerD = contracts.TreasuryScript.redeemProof(redeemerProof);
    // const retdd = contracts.TreasuryScript.getRedeemerFromCBOR(redeemerD.to_hex());
    // const { signature } = await signFn(redeemProofHash);
    switch (mode) {
        case contracts.TreasuryScript.MODE_SCHNORR340:
            {
                const signature = await schnorrSign(redeemProofHash)(payPrvKey);//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature).toString('hex');
                break;
            }
        case contracts.TreasuryScript.MODE_ECDSA:
            {
                const signature = await secp256k1.ecdsaSign(
                    Buffer.from(redeemProofHash, 'hex'), Buffer.from(payPrvKey, 'hex'));//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature.signature).toString('hex');
                // redeemerProof.signature = 'a9982bcf5850708a04f9f9a4693e8a887ed77cccb90f2ae43ada9c95e9373a07654871b6719af32cf18e4579d995c621eb02eee8b3d0e123b3ca0b458f86d0ab';
                console.log(
                    'signature:', redeemerProof.signature,
                    'hash:', redeemProofHash,
                    'pk:', groupInfoParams[2]
                )
                // const checkFlag = secp256k1.ecdsaVerify(Buffer.from(redeemerProof.signature,'hex'),Buffer.from(redeemProofHash,'hex'),Buffer.from(groupInfoParams[2],'hex'))
                break;
            }
        case contracts.TreasuryScript.MODE_ED25519:
            {
                const { signature } = await signFn(redeemProofHash);
                redeemerProof.signature = signature;
                break;
            }
        default:
            throw 'bad signature mode';
    }


    // const groupInfoHolder = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    const groupInfoToken = await getGroupInfoToken();

    const ddd = {
        "to": "addr_test1qpewhjzf3nsh8ytwtkqewf0n8kkynxsva867stedemugsa5a5fxd4tcsgemc7gc4sqfww6f6s0rc45kcsjkd2wzxt2dqnhh2wl",
        "tokenId": "",
        "amount": 0,
        "adaAmount": 1200000,
        "txHash": "44c86950d0e439d7b39a7f46444f35cb254087c9c47fab09d1efdd88c7a978a3",
        "index": 0,
        "mode": 0,
        "signature": "42b99d5802c905ae0c97218b7523200c6a10d6721a84316b4fd79cd2a9924fa314aaabd58199303e70177890bd1743a703fb72d38194c1a800d2bc31eda55967",
        "pk": "03321c8ce4c6aeb91567528c3d863b7405287c340cd992543bf4735ddc9c491ea8",
        "txType": 0,
        "uniqueId": "0x5fcabb67fcb62ff55bd340bb9ec6cf9177d7aba82892e360d6281fdccf5268a2"
    }
    {
        // // console.log('begin :', CardanoWasm.__wasm.memory.buffer.byteLength,CardanoWasm.count);
        // console.log('begin :', CardanoWasm.__wasm.memory.buffer.byteLength);
        // CardanoWasm.outGCMap();
        // for (let i = 0; i < 30000; i++) {
        //     {
        //         const signedTxOutBound = await contracts.TreasuryScript.transferFromTreasury(
        //             protocolParamsGlobal, utxosForFee, treasuryUtxo, treasuryRef
        //             , groupInfoToken, transferValue, to, redeemerProof, [utxosCollateral], treasuryCheckUxto, treasuryCheckRef, admin, evaluate, signFn,
        //             metaData, txTtl);
        //     }
        //     if (i % 100 == 0) {
        //         global.gc();
        //         await sleep(100);

        //         console.log(`【${i}】 ${CardanoWasm.__wasm.memory.buffer.byteLength}`);
        //     }

        // }
        // global.gc();
        // await sleep(5000);
        // // CardanoWasm.freeAll();
        // // console.log('end :', CardanoWasm.__wasm.memory.buffer.byteLength,CardanoWasm.count);
        // console.log('end :', CardanoWasm.__wasm.memory.buffer.byteLength);
        // CardanoWasm.outGCMap();
        // return;
    }
    // {
    //     let totalInputValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('0'));
    //     // let totalOutputValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('0'));

    //     for (let i = 0; i < utxosForFee.length; i++) {
    //         const o = utxosForFee[i];
    //         totalInputValue = totalInputValue.checked_add(utils.funValue(o.value));
    //     }

    //     for (let i = 0; i < treasuryUtxo.length; i++) {
    //         const o = treasuryUtxo[i];
    //         totalInputValue = totalInputValue.checked_add(utils.funValue(o.value));
    //     }
    //     console.log(totalInputValue.to_json());
    // }
    console.log(contracts.TreasuryScript.redeemProof(redeemerProof).to_json());

    const signedTxOutBound = await contracts.TreasuryScript.transferFromTreasury(
        protocolParamsGlobal, utxosForFee, treasuryUtxo, treasuryRef
        , groupInfoToken, /*adminNext*/undefined, to, redeemerProof, [utxosCollateral], treasuryCheckUxto, treasuryCheckRef, admin, evaluate, signFn,
        metaData, txTtl);
    console.log(signedTxOutBound.to_json());
    // console.log(signedTxOutBound.to_hex());
    const ret = await ogmiosUtils.evaluateTx(signedTxOutBound);
    console.log(JSON.stringify(ret));
    const txHashOutBound = await ogmiosUtils.submitTx(signedTxOutBound);
    const r = await ogmiosUtils.waitTxConfirmed(to, txHashOutBound);
    console.log('Transfer outBound successful:', JSON.stringify(r));

}


async function foundationTransfer(to, tokenId, mode = 1) {
    if (tokenId === '') throw 'cannt transfter ada to foundation from ada utxo';
    const treasuryRef = await tryScriptRefUtxo(contracts.TreasuryScript.script());
    console.log(`Treasury ref utxo: ${treasuryRef.txHash + '#' + treasuryRef.index}`);

    const treasuryCheckRef = await tryScriptRefUtxo(contracts.TreasuryCheckScript.script());
    console.log(`treasuryCheckRef ref utxo: ${treasuryCheckRef.txHash + '#' + treasuryCheckRef.index}`);

    const treasuryCheckAddr = contracts.TreasuryCheckScript.address(groupInfoParams[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
    let treasuryCheckUxto = await getCheckTokenUtxo(treasuryCheckAddr);
    if (!treasuryCheckUxto) {
        treasuryCheckUxto = await mintCheckToken(treasuryCheckAddr, 5);
    }

    let utxosForFee = await getUtxoForFee();

    const Multiple = 1;
    let treasuryUtxo = await getTreasuryUtxo(0, tokenId);
    const minAdaTresuryUtxo = utils.getMinAdaOfUtxo(protocolParamsGlobal, to, treasuryUtxo[0].value, utils.genDemoDatum42());
    const minAdaFoundationUtxo = utils.getMinAdaOfUtxo(protocolParamsGlobal, to, { coins: 10000000, assets: {} });
    treasuryUtxo = treasuryUtxo.find(o => {
        return o.value.coins * 1 >= (minAdaTresuryUtxo + minAdaFoundationUtxo)
    });
    treasuryUtxo = treasuryUtxo ? [treasuryUtxo] : [];
    const md = {
        "type": 1,
        "uniqueId": "0xf468acc06f286c1deaa718c1c24f8c7929e888340ebb88003cfb836683076827",
        "tokenPairID": 110,
        "toAccount": "addr_test1wqmpwrh2mlqa04e2mf3vr8w9rjt9du0dpnync8dzc85spgsya8emz", //对端的账号，
        "smgID": "123",
        "fee": 10
    };

    const metaData = { "1": md };//genMetaData({ type: '111', tokenPairID: '222', uniqueId: '333' })
    console.log('metaData = ', metaData);
    if (treasuryUtxo.length <= 0) {
        const minAda = utils.getMinAdaOfUtxo(protocolParamsGlobal, to, { coins: adaAmount, assets: tokenId ? { [tokenId]: amount } : {} });
        const transferValue = { coins: minAda * 2, assets: tokenId ? { [tokenId]: amount * Multiple } : {} };
        const signedTxInBound = await contracts.TreasuryScript.sendFunToTreasury(protocolParamsGlobal, utxosForFee, transferValue, admin, signFn, metaData, groupInfoParams, Multiple);
        console.log('Transfer inBound:', signedTxInBound.to_json());
        const txHashInBound = await ogmiosUtils.submitTx(signedTxInBound);
        const o = await ogmiosUtils.waitTxConfirmed(TreasuryScriptAddress.to_bech32(ADDR_PREFIX), txHashInBound);
        console.log('Transfer inBound successful:', JSON.stringify(o));
        treasuryUtxo = [o];
    }


    const utxosCollateral = await tryGetCollateralUtxo();
    console.log('Collateral utxo', utxosCollateral);

    utxosForFee = await getUtxoForFee();

    let txType = contracts.TreasuryScript.CROSSTX;
    let amount = 0;
    let adaAmount = treasuryUtxo[0].value.coins * 1 - minAdaTresuryUtxo;
    let outputCount = 1;


    const nonce = { txHash: treasuryCheckUxto.txHash, index: treasuryCheckUxto.index };
    const txTtl = await ogmiosUtils.getLastestSolt() + 1000;
    const ttl = Math.floor(await ogmiosUtils.currentNetworkSlotToTimestamp(txTtl));

    const redeemerProof = {
        to, tokenId, amount, adaAmount, txHash: nonce.txHash, index: nonce.index, mode
        , uniqueId: '1234567890123456789012345678901212345678901234567890123456789012'
        , txType, signature: '', ttl, outputCount, pk: groupInfoParams.groupInfoPk
    };

    const redeemProofHash = contracts.TreasuryScript.caculateRedeemDataHash(redeemerProof);

    switch (mode) {
        case contracts.TreasuryScript.MODE_SCHNORR340:
            {
                const signature = await schnorrSign(redeemProofHash)(payPrvKey);//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature).toString('hex');
                break;
            }
        case contracts.TreasuryScript.MODE_ECDSA:
            {
                const signature = await secp256k1.ecdsaSign(
                    Buffer.from(redeemProofHash, 'hex'), Buffer.from(payPrvKey, 'hex'));//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature.signature).toString('hex');
                // redeemerProof.signature = 'a9982bcf5850708a04f9f9a4693e8a887ed77cccb90f2ae43ada9c95e9373a07654871b6719af32cf18e4579d995c621eb02eee8b3d0e123b3ca0b458f86d0ab';
                break;
            }
        case contracts.TreasuryScript.MODE_ED25519:
            {
                const { signature } = await signFn(redeemProofHash);
                redeemerProof.signature = signature;
                break;
            }
        default:
            throw 'bad signature mode';
    }


    // const groupInfoHolder = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    const groupInfoToken = await getGroupInfoToken();


    const signedTxOutBound = await contracts.TreasuryScript.transferFromTreasury(
        protocolParamsGlobal, utxosForFee, treasuryUtxo, treasuryRef
        , groupInfoToken, /*adminNext*/undefined, to, redeemerProof, [utxosCollateral], treasuryCheckUxto, treasuryCheckRef, admin, evaluate, signFn,
        metaData, txTtl);
    console.log(signedTxOutBound.to_json());
    // console.log(signedTxOutBound.to_hex());
    const ret = await ogmiosUtils.evaluateTx(signedTxOutBound);
    console.log(JSON.stringify(ret));
    const txHashOutBound = await ogmiosUtils.submitTx(signedTxOutBound);
    const r = await ogmiosUtils.waitTxConfirmed(to, txHashOutBound);
    console.log('Transfer outBound successful:', JSON.stringify(r));

}

async function mintMappingToken(to, tokenName, amount, mode = 1) {
    const mappingTokenRef = await tryScriptRefUtxo(contracts.MappingTokenScript.script());
    console.log(`mappingToken ref utxo: ${mappingTokenRef.txHash + '#' + mappingTokenRef.index}`);

    const mintCheckRef = await tryScriptRefUtxo(contracts.MintCheckScript.script());
    console.log(`mintCheckRef ref utxo: ${mintCheckRef.txHash + '#' + mintCheckRef.index}`);

    const mintCheckAddr = contracts.MintCheckScript.address(groupInfoParams[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
    let mintCheckUxto = await getCheckTokenUtxo(mintCheckAddr);
    if (!mintCheckUxto) {
        mintCheckUxto = await mintCheckToken(mintCheckAddr, 2);
    }

    let utxosForFee = await getUtxoForFee();

    const md = {
        "type": 2,
        "uniqueId": "0xf468acc06f286c1deaa718c1c24f8c7929e888340ebb88003cfb836683076827",
        "tokenPairID": 110
    };

    const metaData = { "1": md };//genMetaData({ type: '111', tokenPairID: '222', uniqueId: '333' })
    console.log('metaData = ', metaData)

    const utxosCollateral = await tryGetCollateralUtxo();
    console.log('Collateral utxo', utxosCollateral);

    utxosForFee = await getUtxoForFee();

    const tokenId = contracts.MappingTokenScript.tokenId(tokenName);
    const nonce = { txHash: mintCheckUxto.txHash, index: mintCheckUxto.index };
    const txTtl = await ogmiosUtils.getLastestSolt() + 1000;
    const ttl = Math.floor(await ogmiosUtils.currentNetworkSlotToTimestamp(txTtl));
    const redeemerProof = {
        to, tokenId, amount, txHash: nonce.txHash, index: nonce.index, mode
        , uniqueId: '1234567890123456789012345678901212345678901234567890123456789012', ttl
        , signature: '', userData: utils.genDemoDatum42().to_hex()
    };

    const redeemProofHash = contracts.MintCheckScript.caculateRedeemDataHash(redeemerProof);

    switch (mode) {
        case contracts.TreasuryScript.MODE_SCHNORR340:
            {
                const signature = await schnorrSign(redeemProofHash)(payPrvKey);//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature).toString('hex');
                break;
            }
        case contracts.TreasuryScript.MODE_ECDSA:
            {
                const signature = await secp256k1.ecdsaSign(
                    Buffer.from(redeemProofHash, 'hex'), Buffer.from(payPrvKey, 'hex'));//await secp.schnorr.sign(msg, sk);
                redeemerProof.signature = Buffer.from(signature.signature).toString('hex');
                break;
            }
        case contracts.TreasuryScript.MODE_ED25519:
            {
                const { signature } = await signFn(redeemProofHash);
                redeemerProof.signature = signature;
                break;
            }
        default:
            throw 'bad signature mode';
    }


    const groupInfoToken = await getGroupInfoToken();
    // const ttl = await ogmiosUtils.getLastestSolt() + 1000;
    const signedTxMintMappingToken = await contracts.MappingTokenScript.mint(
        protocolParamsGlobal, utxosForFee, [utxosCollateral], mappingTokenRef
        , mintCheckRef, groupInfoToken, mintCheckUxto, redeemerProof, admin, evaluate, signFn, txTtl, metaData);

    console.log('signedTxMintMappingToken:\n', signedTxMintMappingToken.to_json());
    // console.log(signedTxOutBound.to_hex());
    const ret = await ogmiosUtils.evaluateTx(signedTxMintMappingToken);
    console.log(ret);
    const txHashOutBound = await ogmiosUtils.submitTx(signedTxMintMappingToken);
    const r = await ogmiosUtils.waitTxConfirmed(admin, txHashOutBound);
    console.log('Mint MappingToken successful:', JSON.stringify(r));

}

async function burnMappingToken(tokenName, amount) {
    const mappingTokenRef = await tryScriptRefUtxo(contracts.MappingTokenScript.script());
    console.log(`mappingToken ref utxo: ${mappingTokenRef.txHash + '#' + mappingTokenRef.index}`);

    let utxosForFee = await ogmiosUtils.getUtxo(adminNext);

    const md = {
        "type": 2,
        "uniqueId": "0xf468acc06f286c1deaa718c1c24f8c7929e888340ebb88003cfb836683076827",
        "tokenPairID": 110
    };

    const metaData = { "1": md };//genMetaData({ type: '111', tokenPairID: '222', uniqueId: '333' })
    console.log('metaData = ', metaData)

    let utxosCollateral = (await ogmiosUtils.getUtxo(adminNext, 100000000)).filter(o => {
        return !o.value.assets || Object.keys(o.value.assets).length <= 0
    });

    const signFnNext = async hash => {
        return ogmiosUtils.signFn(payPrvKeyNext, hash);
    }

    if (utxosCollateral.length <= 0) {
        const signedTx = await utils.transfer(protocolParamsGlobal, utxosForFee, adminNext, { coins: 100000000 }, adminNext, undefined, undefined, signFnNext);
        const txHash = await ogmiosUtils.submitTx(signedTx);
        const o = await ogmiosUtils.waitTxConfirmed(adminNext, txHash);
        // utxosCollateral = (await ogmiosUtils.getUtxo(adminNext, 100000000)).filter(o => {
        //     return !o.value.assets || Object.keys(o.value.assets).length <= 0
        // });
        utxosForFee = await ogmiosUtils.getUtxo(adminNext);
        utxosCollateral = [o];
    }
    console.log('Collateral utxo', utxosCollateral);
    utxosForFee = utxosForFee.filter(item => utxosCollateral.findIndex(o => o.txHash == item.txHash && o.index == item.index) < 0);
    utxosForFee = utxosForFee.sort((a, b) => b.value.coins * 1 - a.value.coins * 1);
    utxosForFee = utxosForFee.slice(0, 1);

    // utxosForFee = await getUtxoForFee();

    const tokenId = contracts.MappingTokenScript.tokenId(tokenName);

    const burnUtxos = await getMappingTokenUtxo(adminNext, tokenName, amount);



    const ttl = await ogmiosUtils.getLastestSolt() + 1000;
    const signedTxBurnMappingToken = await contracts.MappingTokenScript.burn(
        protocolParamsGlobal, utxosForFee, utxosCollateral, mappingTokenRef
        , burnUtxos, tokenId, amount, adminNext, signFnNext, ttl, metaData);

    console.log('signedTxMintMappingToken:\n', signedTxBurnMappingToken.to_json());
    // console.log(signedTxOutBound.to_hex());
    const ret = await ogmiosUtils.evaluateTx(signedTxBurnMappingToken);
    console.log(ret);
    const txHashOutBound = await ogmiosUtils.submitTx(signedTxBurnMappingToken);
    const r = await ogmiosUtils.waitTxConfirmed(adminNext, txHashOutBound);
    console.log('Burn MappingToken successful:', JSON.stringify(r));

}

async function setAdmin(addr) {
    console.log('setAdmin to:', addr);
    const groupInfoHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee = await getUtxoForFee();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    let utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    // console.log(CardanoWasm.PlutusData.from_hex(utxosHolder.datum).to_json(0));

    const collateralUtxo = await tryGetCollateralUtxo();
    console.log('GroupInfo preupdate gpk:', JSON.stringify(utxosHolder));
    const newAdmin = utils.addressToPkhOrScriptHash(addr);
    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const signedTx = await contractsMgr.GroupInfoNFTHolderScript.updateAdmin(
        protocolParamsGlobal, utxosForFee, [collateralUtxo], utxosHolder, groupInfoHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, newAdmin, admin, undefined, signFn);
    // console.log('Update signedTx:', signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(ret);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash);
    console.log('GroupInfo after update Admin:', JSON.stringify(o));

    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o.datum);
    console.log('new group Info:', groupInfo);

}

async function setOracleWorker(addr) {
    console.log('setOracle to:', addr);
    const groupInfoHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee = await getUtxoForFee();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    let utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    {
        const groupInfoUtxo = await getGroupInfoToken();
        const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(groupInfoUtxo.datum);
        console.log('old group Info:', groupInfo);
    }

    const collateralUtxo = await tryGetCollateralUtxo();
    console.log('GroupInfo old:', JSON.stringify(utxosHolder));
    const newOracleWorker = utils.addressToPkhOrScriptHash(addr);
    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const signedTx = await contractsMgr.GroupInfoNFTHolderScript.setOracleWorker(
        protocolParamsGlobal, utxosForFee, [collateralUtxo], utxosHolder, groupInfoHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, newOracleWorker, admin, undefined, signFn);
    // console.log('Update signedTx:', signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(ret);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash);
    console.log('GroupInfo after update OracleWorker:', JSON.stringify(o));

    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o.datum);
    console.log('new group Info:', groupInfo);

}

async function setBalanceWorker(addr) {
    console.log('setBalanceWorker to:', addr);
    const groupInfoHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee = await getUtxoForFee();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    let utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    // console.log(CardanoWasm.PlutusData.from_hex(utxosHolder.datum).to_json(0));

    const collateralUtxo = await tryGetCollateralUtxo();
    console.log('GroupInfo preupdate gpk:', JSON.stringify(utxosHolder));
    const newBalanceWorker = utils.addressToPkhOrScriptHash(addr);
    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const signedTx = await contractsMgr.GroupInfoNFTHolderScript.setBalanceWorker(
        protocolParamsGlobal, utxosForFee, [collateralUtxo], utxosHolder, groupInfoHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, newBalanceWorker, admin, undefined, signFn);
    // console.log('Update signedTx:', signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(ret);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash);
    console.log('GroupInfo after update BalanceWorker:', JSON.stringify(o));

    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o.datum);
    console.log('new group Info:', groupInfo);

}

async function setVerion(addr) {
    console.log('setVerion to:', addr);
    const groupInfoHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee = await getUtxoForFee();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    let utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    // console.log(CardanoWasm.PlutusData.from_hex(utxosHolder.datum).to_json(0));

    const collateralUtxo = await tryGetCollateralUtxo();
    console.log('GroupInfo preupdate gpk:', JSON.stringify(utxosHolder));
    const newVersion = utils.addressToPkhOrScriptHash(addr);
    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const signedTx = await contractsMgr.GroupInfoNFTHolderScript.setVersion(
        protocolParamsGlobal, utxosForFee, [collateralUtxo], utxosHolder, groupInfoHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, newVersion, admin, undefined, signFn);
    // console.log('Update signedTx:', signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(ret);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash);
    console.log('GroupInfo after update BalanceWorker:', JSON.stringify(o));

    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o.datum);
    console.log('new group Info:', groupInfo);

}

async function switchGroup(groupInfoPk) {
    console.log('switchGroup to:', groupInfoPk);
    const groupInfoHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee = await getUtxoForFee();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    let utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());

    // console.log(CardanoWasm.PlutusData.from_hex(utxosHolder.datum).to_json(0));

    const collateralUtxo = await tryGetCollateralUtxo();
    console.log('GroupInfo preupdate gpk:', JSON.stringify(utxosHolder));
    const signedTx = await contractsMgr.GroupInfoNFTHolderScript.switchGroup(
        protocolParamsGlobal, utxosForFee, [collateralUtxo], utxosHolder, groupInfoHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, groupInfoPk, admin, undefined, signFn);
    console.log('Update signedTx:', signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(ret);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash);
    console.log('GroupInfo after update gpk:', JSON.stringify(o));

    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o.datum);
    console.log('new group Info:', groupInfo);

}

async function setMintCheckVH(mintCheckVH) {
    console.log('set mintCheckVH to:', mintCheckVH);
    const groupNFTHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    // console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee = await getUtxoForFee();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    let utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    // console.log(CardanoWasm.PlutusData.from_hex(utxosHolder.datum).to_json(0));

    const collateralUtxo = await tryGetCollateralUtxo();
    // console.log('GroupInfo preupdate gpk:', JSON.stringify(utxosHolder));
    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const signedTx = await contractsMgr.GroupInfoNFTHolderScript.setMintCheckVH(
        protocolParamsGlobal, utxosForFee, [collateralUtxo], utxosHolder, groupNFTHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, mintCheckVH, admin, undefined, signFn);
    // console.log('Update signedTx:', signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(ret);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash);
    // console.log('GroupInfo after update gpk:', JSON.stringify(o));

    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o.datum);
    console.log('new group Info:', groupInfo);
}

async function setTreasuryCheckVH(treasuryCheckVH) {
    console.log('set treasuryCheckVH to:', treasuryCheckVH);
    const groupNFTHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    // console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee = await getUtxoForFee();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    let utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });

    // console.log(CardanoWasm.PlutusData.from_hex(utxosHolder.datum).to_json(0));
    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const collateralUtxo = await tryGetCollateralUtxo();
    // console.log('GroupInfo preupdate gpk:', JSON.stringify(utxosHolder));
    const signedTx = await contractsMgr.GroupInfoNFTHolderScript.setTreasuryCheckVH(
        protocolParamsGlobal, utxosForFee, [collateralUtxo], utxosHolder, groupNFTHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, treasuryCheckVH, admin, undefined, signFn);
    // console.log('Update signedTx:', signedTx.to_json());
    const ret = await ogmiosUtils.evaluateTx(signedTx);
    console.log(ret);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash);
    // console.log('GroupInfo after update gpk:', JSON.stringify(o));

    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o.datum);
    console.log('new group Info:', groupInfo);


}


async function updateAdmin(adminPKH) {
    console.log('update admin to:', adminPKH);
    const groupInfoHolderRef = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    console.log(`GroupInfoHolder ref utxo: ${groupInfoHolderRef.txHash + '#' + groupInfoHolderRef.index}`);

    const utxosForFee2 = await getUtxoForFee();
    const collateralUtxo2 = await tryGetCollateralUtxo();
    const groupInfoHolderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
    utxosHolder = await ogmiosUtils.getUtxo(groupInfoHolderAddr);
    utxosHolder = utxosHolder.find(o => {
        const value = o.value;
        for (const tokenId in value.assets) {
            if (tokenId == contractsMgr.GroupNFT.tokenId()) return true;
        }
        return false;
    });
    console.log('GroupInfo preupdate admin:', JSON.stringify(utxosHolder));
    const adminNftUtxo = await getAdminNft();
    const adminNftHoldRefScript = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
    const signedTx2 = await contractsMgr.GroupInfoNFTHolderScript.updateAdmin(
        protocolParamsGlobal, utxosForFee2, [collateralUtxo2], utxosHolder, groupInfoHolderRef, { adminNftUtxo, adminNftHoldRefScript, mustSignBy }, adminPKH, admin, undefined, signFn);
    // console.log('Update signedTx:', signedTx2.to_json());
    const ret2 = await ogmiosUtils.evaluateTx(signedTx2);
    console.log(ret2);
    const txHash2 = await ogmiosUtils.submitTx(signedTx2);
    const o2 = await ogmiosUtils.waitTxConfirmed(groupInfoHolderAddr, txHash2);
    console.log('GroupInfo after update admin:', JSON.stringify(o2));


    const groupInfo = contractsMgr.GroupNFT.groupInfoFromDatum(o2.datum);
    console.log('new group Info:', groupInfo);

}

async function transferTo(to, amount, datum) {
    const utxosForFee = await getUtxoForFee();
    // const to = 'addr_test1wqkzgx3nvmayxl4m06lyym83gv3twclnypqm8jnm62za4hgnygzfj'
    const signedTx = await utils.transfer(protocolParamsGlobal, utxosForFee, to
        , { coins: amount }, admin, datum, undefined, signFn);
    const txHash = await ogmiosUtils.submitTx(signedTx);
    const o = await ogmiosUtils.waitTxConfirmed(to, txHash);
    console.log(o);
}
// 
const host = '127.0.0.1';
// const host = '52.13.9.234'//preview
// const host = '44.229.225.45';//preprod
// const host = 'nodes-testnet.wandevs.org/cardano-origin';
// const host = 'nodes-testnet.wandevs.org'
// const host = 'ogmios.wanchain.gomaestro-api.org'
const port = "";
const apiKey = 'v0LXAjiRQAm3PNjlFSlqB8rfgUp7OExE';

const showMappingToken = function (MappingTokenName) {
    console.log(MappingTokenName, 'Mapping Token:', contracts.MappingTokenScript.tokenId(MappingTokenName));
}
showMappingToken('SHARDS-MATIC-USLP');
const showAllInfo = async function () {
    console.log(`The contracts informations on ${ADDR_PREFIX == 'addr_test' ? 'testnet' : 'mainnet'}`);
    {
        //USDT/ USDC/ETH/BTC/WAN/ADA
        console.log('Treasury Address:', contracts.TreasuryScript.address(contractsMgr.StoremanStackScript.script().hash().to_hex()).to_bech32(ADDR_PREFIX));
        showMappingToken('USDT');
        showMappingToken('USDC');
        showMappingToken('ETH');
        showMappingToken('BTC');
        showMappingToken('WAN');
    }
    {
        const ref1 = await tryScriptRefUtxo(contracts.TreasuryScript.script());
        const ref2 = await tryScriptRefUtxo(contracts.TreasuryCheckScript.script());
        const ref3 = await tryScriptRefUtxo(contracts.MappingTokenScript.script());
        const ref4 = await tryScriptRefUtxo(contracts.MintCheckScript.script());
        const ref5 = await tryScriptRefUtxo(contracts.TreasuryCheckTokenScript.script());
        const ref6 = await tryScriptRefUtxo(contracts.MintCheckTokenScript.script());

        const ref7 = await tryScriptRefUtxo(contractsMgr.GroupNFT.script());
        const ref8 = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
        const ref9 = await tryScriptRefUtxo(contractsMgr.AdminNFT.script());
        const ref10 = await tryScriptRefUtxo(contractsMgr.AdminNFTHolderScript.script());
        const ref11 = await tryScriptRefUtxo(contractsMgr.StoremanStackScript.script());
        const ref12 = await tryScriptRefUtxo(contractsMgr.StakeCheckScript.script());

        const scriptRefs = [ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, ref10, ref11, ref12];
        let sum = 0;
        for (let i = 0; i < scriptRefs.length; i++) {
            sum += scriptRefs[i].value.coins * 1;
        }
        console.log('Total Banding ada:', sum);
        console.log('MappingToken script reft utxo', ref3.txHash + '#' + ref3.index);

    }

}

const mappingTokenNameWan = 'Ada-Wan';
const mappingTokenNameWasp = 'Ada-Wasp';

{
    const MappingTokenName = 'EUROC';
    console.log(MappingTokenName, 'Mapping Token:', contracts.MappingTokenScript.tokenId(MappingTokenName));
}
{
    const MappingTokenName = 'DAI';
    console.log(MappingTokenName, 'Mapping Token:', contracts.MappingTokenScript.tokenId(MappingTokenName));
}

async function main() {

    await ogmiosUtils.init_ogmios({ host, tls: false });


    protocolParamsGlobal = await ogmiosUtils.getParamProtocol();
    {
        // const value = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('3000'));
        // console.log(value.to_json());
        // const minada = utils.getMinAdaOfUtxo(protocolParamsGlobal,admin,value);
        // console.log(value.to_json());
    }
    // await showAllInfo();


    const bigN = CardanoWasm.BigNum.max_value();//from_str('99687000000000000000000');
    console.log(bigN.to_str())
    // CardanoWasm.Value.from_hex('').coin()
    const pubKh = CardanoWasm.BaseAddress.from_address(CardanoWasm.Address.from_bech32(admin)).payment_cred().to_keyhash().to_hex();;
    console.log('FakeToken:', contracts.FakeToken.tokenId(pubKh, Fake_Token_Name));

    // await mintFakeToken('addr_test1qpstydtgjfyavqecas5w730m86tltgl3ask2xsl3hfl2vw9ng88pgc8c4mh3tx0mpm2es8e54w86rvat6de0nmgec5ast965pg')
    {
        // let os = await ogmiosUtils.getUtxo('addr_test1xqweycval58x8ryku838tjqypgjzfs3t4qjj0pwju6prgmjwsw5k2ttkze7e9zd3jr00x5nkhmpx97cv6xx25jsgxh2swlkfgp');
        // os = os.filter(o=>o.txHash == '1514d34c7bacfc1f3cdd821816f040c5a45063cb1cf940415182362144d22299')
        // const tx = '84aa008482582008e50fa3804b6f69c72d0e61fb7393ca0946ebf6989c5e9d826e2dfcf6382e7e008258201514d34c7bacfc1f3cdd821816f040c5a45063cb1cf940415182362144d22299018258201514d34c7bacfc1f3cdd821816f040c5a45063cb1cf940415182362144d22299028258209160353890aba3466aa4df7159f5e1716ba5f5d6751980d8edafe2bf9035e625020183a30058393038961b4f55abd6f9d96094e382eafa8fbce0dda974789ba7b04111ab4e83a9652d76167d9289b190def35276bec262fb0cd18caa4a0835d501821a00129c92a1581c4295914ef5ff86204642d3334ee444f9dafc694b4da246b39b68fbb0a14a54436865636b436f696e01028201d81845d8799f01ffa3005839301d92619dfd0e638c96e1e275c8040a2424c22ba8252785d2e682346e4e83a9652d76167d9289b190def35276bec262fb0cd18caa4a0835d5011a0024b274028201d81845d8799f01ff8258390004cfd2f0ff625f9c54d212c7d0fadb4263b4c189ccd973b570f1d1fd04cfd2f0ff625f9c54d212c7d0fadb4263b4c189ccd973b570f1d1fd821a004bad34a1581c892a0ee29cbc0f9fe5ae34296a299464d38ced9f76d1701625dfbb42a1444745524f19da38021a0005f6ca031a024aae99075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6c0b582097ba7b380864275df2c0f4936cad22383068cb869ad9fb6be2d510bcf8b162280d818258209160353890aba3466aa4df7159f5e1716ba5f5d6751980d8edafe2bf9035e62502108258390004cfd2f0ff625f9c54d212c7d0fadb4263b4c189ccd973b570f1d1fd04cfd2f0ff625f9c54d212c7d0fadb4263b4c189ccd973b570f1d1fd1a004601b2111a000ba24c1286825820a095fbfc830b5a1a70b19a76689b4012b0d6e8b0b1e6ca73936c4de04d4e0ac900825820a1ebc1744ca07d41e726966e55e01499af31be5746b769cb0fb0d5afae3b4cd2008258201514d34c7bacfc1f3cdd821816f040c5a45063cb1cf940415182362144d22299018258201514d34c7bacfc1f3cdd821816f040c5a45063cb1cf940415182362144d2229902825820d576d0ed1d7ed9e9bf34c6902e98738e2a9aa158a112909440c66234916b4fd20082582008e50fa3804b6f69c72d0e61fb7393ca0946ebf6989c5e9d826e2dfcf6382e7e00a30081825820a93f3b7854ba218b8642121a9c1f0b8e14b3f6ba40d9e703df6cd21ae656aff95840d52321232ae1076ba65dcc749ea704202c93ca0187b82e4956b102fe1ec4f363b42c6908b8b66493b377d84108a0c228796894f021585c5bdb1481fb1fcb560103800583840000d87a9fd8799f581c1d92619dfd0e638c96e1e275c8040a2424c22ba8252785d2e682346e581c4e83a9652d76167d9289b190def35276bec262fb0cd18caa4a0835d54040001a0024b274582008e50fa3804b6f69c72d0e61fb7393ca0946ebf6989c5e9d826e2dfcf6382e7e000040011b0000018a7222b9a8015840ac3928f2a78cb50d82016948af53c71cba920404f8aa1eaa2de5cf964c85bd967ac97bb3c2a7dec9b60e9bf14b7bb05e2be888af79dfda2081c97007ff7b4ea1ffff821a000c6b901a1cc7a85b840001d87980821a000c275c1a035dc7c2840002d87980821a000c275c1a035dc7c2f5a0';
        // const signedtx = CardanoWasm.Transaction.from_hex(tx);
        // console.log(signedtx.to_json());
        // let ret = await ogmiosUtils.evaluate(tx);
        // let txHash = await ogmiosUtils.submitTx(signedtx);
        // await ogmiosUtils.waitTxConfirmed(admin,txHash);
    }

    {
        // const inputs = await getUtxoForFee();
        // const to = 'addr1q8axuv7fnsa2c7tdaxg6jgpjpsh3andupgvzk49zrr62m84j7n9nntfqwhqpq6qsv67l25gr4fv8kqvhcaexv7l3twvsnazlgz';
        // let signedTx = await utils.transfer(protocolParamsGlobal,inputs,to,{coins:20000000},admin,undefined,undefined,signFn);
        // let txHash = await ogmiosUtils.submitTx(signedTx);
        // await ogmiosUtils.waitTxConfirmed(admin,txHash);
        // const ref1 = await tryScriptRefUtxo(contracts.TreasuryCheckScript.script());
        // console.log(ref1.txHash+'#'+ref1.index);
    }
    // await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
    console.log('GroupInfoNFTHolder address:', contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX));

    // const dt = '84ab0081825820929429eb3b417f9ae49b126e246f25979a3be6c55ba016f08144bb07e86c4f7101018182583901e6da7b55ab70b0eef4154bc2d8cd80f4b504cf921f985512093d660aca6e70d3cead51d65be7fd05f5901d60080d29d2dbd3da61e728d8b8821a3a140fa1a1581c25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935a24357414e1a0098968044555344431a00ad1ec0021a0005c902031a05e235da0758201f553fe8ee242269d714d9851d9fb1d419f46f6db7d3942e67a2d12821f74cf409a1581c25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935a144555344433a000f423f0b5820e4a41f428ef415e68f39fac3b468148e7b65aa7d566eec61015e7aa0943c07f10d81825820b01772de94c36de2917ed6070372a87af97b434ad51f050bdabf1b2f5a984b73001082583901e6da7b55ab70b0eef4154bc2d8cd80f4b504cf921f985512093d660aca6e70d3cead51d65be7fd05f5901d60080d29d2dbd3da61e728d8b81a00413f4c111a000b0bf41281825820fffb1b66bd78837ea0136587c354ee6a0991b6d0a2954e48d46a476b3ce683df00a203800581840100d87980821a00209b4e1a25d13becf5a101a56b66726f6d4163636f756e74827840616464723171386e643537363434646374706d68357a343975396b786473723674327078306a6730657334676a7079376b767a6b3264656364386e346432387478273968656c6171683665713874717071786a6e356b6d36306478726565676d7a75716573616e796d65736d6749445820000000000000000000000000000000000000000000000041726965735f30333269746f4163636f756e74548b157b3ffead48c8a4cdc6bddbe1c1d170049da46b746f6b656e506169724944190202647479706508';
    // const signtx = CardanoWasm.Transaction.from_hex(dt);
    // console.log(signtx.to_json());
    // const exuint = await ogmiosUtils.evaluate(dt)

    // const costModesLib = protocolParamsGlobal.costModels;
    // const tmp = CardanoWasm.Costmdls.new();
    // tmp.insert(CardanoWasm.Language.new_plutus_v2(), costModesLib.get(CardanoWasm.Language.new_plutus_v2()));
    // // tmp.insert(CardanoWasm.Language.new_plutus_v1(), costModesLib.get(CardanoWasm.Language.new_plutus_v1()));
    // const hash = CardanoWasm.hash_script_data(signtx.witness_set().redeemers(), tmp, signtx.witness_set().plutus_data());
    // console.log('script_data_hash:',hash.to_hex());
    // const ret = await ogmiosUtils.evaluateTx(signtx);
    // const txHash = await ogmiosUtils.submitTx(signtx);

    await tryGetParameterizedRefUtxo();
    await tryGetParameterizedRefUtxo2();
    await tryGetCollateralUtxo();

    {
        // const utxosforFee = await getUtxoForFee();
        // console.log(utxosforFee);
        // const to = 'addr_test1qqesh9yrdf4ghwm5p8muwuapvgwxxk4ywa9mzgke2vg9mv5zgtcshah4maetd86h08jjednyrermpej7rf0jd240tnlqx6g0kv';
        // const ttt = await utils.transfer(protocolParamsGlobal, utxosforFee, to, {
        //     coins: 4000000,
        //     assets: {
        //         '016b867479a2dc029387384d479659bf94bd883d76b064765eaff68c.4164612d57616e': '600000',
        //         '315c877aa583307febecd2d95d162d4d3a2ba074f7b3acc4a033e66b.4164612d57616e': '1080000',
        //         '343ac71f7f3b2dbd4efa1e9735c2ac2cb7ae777d5325db23d9f77332.616263': '199952000000',
        //         '37e6dc3bb48dac60e6588dc4bd55e72904da938596ba55f998e8e6be.4164612d57616e': '600000',
        //         '9772ff715b691c0444f333ba1db93b055c0864bec48fff92d1f2a7fe.446a65645f746573744d6963726f555344': '29999990',
        //         'd2a8592ec9673ac18fea1044885f94518e954ab0cb2b6bb0a328d2af.4164612d57616e': '2000000000',
        //         'd5d25ef96acacaf5690e5549139645484796be537c149f0b4d48cfbf.57415350': '2100000000'
        //     }
        // },utxosforFee[0].address,undefined,undefined,signFn);

        // const txHash = await ogmiosUtils.submitTx(ttt);
        // await ogmiosUtils.waitTxConfirmed(admin,txHash);
    }
    let goupInfoTokenUtxo = await getGroupInfoToken();
    let adminNftUtxo = await getAdminNft();
    if (!adminNftUtxo) {
        protocolParamsGlobal = await ogmiosUtils.getParamProtocol();
        adminNftUtxo = await mintAdminNft();
    }

    if (!goupInfoTokenUtxo) {
        protocolParamsGlobal = await ogmiosUtils.getParamProtocol();
        goupInfoTokenUtxo = await mintGroupInfoToken();
    } else {
        const gpk = secp256k1.publicKeyCreate(Buffer.from(payPrvKey, 'hex'));
        const newGpk = Buffer.from(gpk).toString('hex');
        const params = contractsMgr.GroupNFT.groupInfoFromDatum(goupInfoTokenUtxo.datum);
        const holderSH = contractsMgr.GroupInfoNFTHolderScript.script().hash().to_hex();
        const holderAddr = contractsMgr.GroupInfoNFTHolderScript.address().to_bech32(ADDR_PREFIX);
        if (holderSH != params[contractsMgr.GroupNFT.Version]) {
            console.log('should be:', holderSH, '\nbut be:', params[contractsMgr.GroupNFT.Version]);
        }
        if (groupInfoParams[contractsMgr.GroupNFT.GPK].toLowerCase() != params[contractsMgr.GroupNFT.GPK].toLowerCase()
            && params[contractsMgr.GroupNFT.GPK].toLowerCase() != newGpk) {
            // throw 'wrong groupPK';
        }
        if (groupInfoParams[contractsMgr.GroupNFT.Admin].toLowerCase() != params[contractsMgr.GroupNFT.Admin].toLowerCase()) {
            // throw 'wrong adminPKH';
        }
        {
            const treasuryCheckAddr = contracts.TreasuryCheckScript.address(groupInfoParams[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
            const mintCheckAddr = contracts.MintCheckScript.address(groupInfoParams[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
            console.log('TreasuryCheck address:', treasuryCheckAddr);
            console.log('MintCheck address:', mintCheckAddr);

        }

        {

            console.log('TreasuryScriptAddress:', TreasuryScriptAddress.to_bech32(ADDR_PREFIX));
            // showMappingToken(mappingTokenNameWan);
            // showMappingToken(mappingTokenNameWasp);

            // const treasuryCheckAddr = contracts.TreasuryCheckScript.address(params[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
            // const mintCheckAddr = contracts.MintCheckScript.address(params[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
            // const cc1 = getCheckTokenClass(treasuryCheckAddr);
            // console.log('TCheckToken id:', cc1.tokenId());
            // const cc2 = getCheckTokenClass(mintCheckAddr);
            // console.log('MCheckToken id:', cc2.tokenId());
            const scriptTmp = contracts.MintCheckScript.script();
            const mappingTokenRef = await tryScriptRefUtxo(scriptTmp);
            const buf = Buffer.from(mappingTokenRef.script['plutus:v2'], 'hex');
            const cborHex = await cbor.encode(buf, 'buffer');
            console.log('{', cborHex.toString('hex'), '}');

            console.log('['
                , scriptRefOwnerAddr, '\n'
                , scriptTmp.to_hex() === '590b04' + mappingTokenRef.script['plutus:v2'], '\n'
                , scriptTmp.to_hex() === cborHex.toString('hex'), '\n'
                , scriptTmp.hash().to_hex(), CardanoWasm.PlutusScript.from_bytes_v2(cborHex).hash().to_hex(), ']');

            const mappingTokenRef2 = await ogmiosUtils.getScriptRefByScriptHash(scriptRefOwnerAddr, scriptTmp.hash().to_hex());
            console.log(mappingTokenRef.txHash + '#' + mappingTokenRef.index === mappingTokenRef2.txHash + '#' + mappingTokenRef2.index);

        }

    }

    protocolParamsGlobal = await ogmiosUtils.getParamProtocol();
    const to = 'addr_test1qpstydtgjfyavqecas5w730m86tltgl3ask2xsl3hfl2vw9ng88pgc8c4mh3tx0mpm2es8e54w86rvat6de0nmgec5ast965pg';
    const tokenId = contracts.FakeToken.tokenId(pubKh, Fake_Token_Name);

    const mode = contracts.TreasuryScript.MODE_ECDSA;

    const gpkXY = '04321c8ce4c6aeb91567528c3d863b7405287c340cd992543bf4735ddc9c491ea879918b4cfccdc11fe9130d05a8744ae4ae77f362893c08b069196080a8a6b205'
    const gpkTest = Buffer.from(secp256k1.publicKeyConvert(Buffer.from(gpkXY, 'hex'), true)).toString('hex');
    console.log(gpkTest);

    {
        // const o = await tryScriptRefUtxo(contractsMgr.GroupInfoNFTHolderScript.script());
        // console.log(JSON.stringify(o));
    }

    // await setTreasuryCheckVH('215a129b7534b7c55f61c085960129aee625d52ef50e42a61de630ba');
    // await setMintCheckVH('23bfa1847616a108976516bdc13ac781c26d9334ccf9da2e16945705');

    // {                         //   addr_test1xqyr73v7av0z89evdlseq4paew7tchtdh8zgjfqrag5g8qjwsw5k2ttkze7e9zd3jr00x5nkhmpx97cv6xx25jsgxh2sn2f9g3
    //     const treasuryCheckAddr = 'addr_test1xqs45y5mw56t032lv8qgt9sp9xhwvfw49m6sus4xrhnrpwjwsw5k2ttkze7e9zd3jr00x5nkhmpx97cv6xx25jsgxh2sh4zls7';
    //     let treasuryCheckUxto = await getCheckTokenUtxo(treasuryCheckAddr);
    //     if (!treasuryCheckUxto) {
    //         treasuryCheckUxto = await mintCheckToken(treasuryCheckAddr, 5);
    //     }
    // }
    // {                       // addr_test1xzcq000trpfu7s4rd6c8wdcctesgkauvazntjjnwmrmv0vjwsw5k2ttkze7e9zd3jr00x5nkhmpx97cv6xx25jsgxh2sfnjm4p
    //     const mintCheckAddr = 'addr_test1xq3mlgvywct2zzyhv5ttmsf6c7quymvnxnx0nk3wz629wp2wsw5k2ttkze7e9zd3jr00x5nkhmpx97cv6xx25jsgxh2swesly4';
    //     let mintCheckUxto = await getCheckTokenUtxo(mintCheckAddr);
    //     if (!mintCheckUxto) {
    //         mintCheckUxto = await mintCheckToken(mintCheckAddr, 5);
    //     }
    // }
    // return;

    {
        //switch gpk to ecdsa
        const gpk = secp256k1.publicKeyCreate(Buffer.from(payPrvKey, 'hex'));
        const newGpk = Buffer.from(gpk).toString('hex');
        const params = contractsMgr.GroupNFT.groupInfoFromDatum(goupInfoTokenUtxo.datum);
        let pk;// = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().to_hex();
        // if (newGpk.toLowerCase() != groupInfoPk.toLowerCase()) {
        switch (mode) {
            case contracts.TreasuryScript.MODE_ECDSA: {
                const gpk = secp256k1.publicKeyCreate(Buffer.from(payPrvKey, 'hex'));
                pk = Buffer.from(gpk).toString('hex');
                break;
            }
            case contracts.TreasuryScript.MODE_ED25519: {
                pk = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().to_hex();
                break;
            }
            case contracts.TreasuryScript.MODE_SCHNORR340: {
                pk = Buffer.from(secp.schnorr.getPublicKey(payPrvKey)).toString('hex');
                break;
            }
            default:
                break;
        }//02d55a510b6890d6eb2fc778e33db2b9376c9427f247f1117ec227be8ae5303514 03321c8ce4c6aeb91567528c3d863b7405287c340cd992543bf4735ddc9c491ea8
        if (pk.toLowerCase() != params[contractsMgr.GroupNFT.GPK].toLowerCase()) {
            // await switchGroup(newGpk);
            await switchGroup(pk);
        }
        // await switchGroup(pk);
        const stake_cred = CardanoWasm.StakeCredential.from_keyhash(
            CardanoWasm.Ed25519KeyHash.from_hex(
                'b4b75848843d485a3e2f1f95783763afb58009e5ff444cde1dfd3e19'
            )
        );

        {
            const treasuryCheckAddr = contracts.TreasuryCheckScript.address(groupInfoParams[contractsMgr.GroupNFT.StkVh]).to_bech32(ADDR_PREFIX);
            // const treasuryCheckUxto = await mintCheckToken(treasuryCheckAddr, 2);
        }


        if (gpkTest.toLowerCase() != params[contractsMgr.GroupNFT.GPK].toLowerCase()) {
            // await switchGroup(gpkTest);
        }
        if (params[contractsMgr.GroupNFT.TreasuryCheckVH].toLowerCase() != contracts.TreasuryCheckScript.script().hash().to_hex().toLowerCase()) {
            console.log('old TreasuryCheckVH:', params[contractsMgr.GroupNFT.TreasuryCheckVH].toLowerCase());
            console.log('new TreasuryCheckVH:', contracts.TreasuryCheckScript.script().hash().to_hex().toLowerCase());
            await setTreasuryCheckVH(contracts.TreasuryCheckScript.script().hash().to_hex());
        }

        {
            // console.log('old TreasuryCheckVH:', params[contractsMgr.GroupNFT.TreasuryCheckVH].toLowerCase());
            // console.log('new TreasuryCheckVH:', contracts.TreasuryCheckScript.script().hash().to_hex().toLowerCase());
            // await setBalanceWorker(adminNext);
        }

        // const o = await crossTransfer(adminNext, '343ac71f7f3b2dbd4efa1e9735c2ac2cb7ae777d5325db23d9f77332.616263', 2000000, 1800000, mode);
        // const o = await crossTransfer(adminNext, '9772ff715b691c0444f333ba1db93b055c0864bec48fff92d1f2a7fe.446a65645f746573744d6963726f555344', 10, 60000000, mode);
        let sssss = CardanoWasm.ScriptPubkey.new(CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(payPrvKey, 'hex')).to_public().hash());
        let baseAddr = CardanoWasm.BaseAddress.new(CardanoWasm.NetworkIdKind.Testnet
            , CardanoWasm.StakeCredential.from_scripthash(CardanoWasm.NativeScript.new_script_pubkey(sssss).hash())
            , CardanoWasm.StakeCredential.from_keyhash(psk.to_public().hash())
        ).to_address().to_bech32();
        {
            baseAddr = 'addr_test1wqk0z6ytud0v2s3g62zddt3fw093572j2u4ypxywqpnszjcsh4t5r';
            // const tmpContractsAddr = CardanoWasm.Address.from_bech32('addr_test1wqk0z6ytud0v2s3g62zddt3fw093572j2u4ypxywqpnszjcsh4t5r');
            // const enterpriseAddr = CardanoWasm.EnterpriseAddress.from_address(tmpContractsAddr);
            // baseAddr = CardanoWasm.BaseAddress.new(isMainnet ? 1 : 0
            //     , CardanoWasm.StakeCredential.from_scripthash(enterpriseAddr.payment_cred().to_scripthash())
            //     , CardanoWasm.StakeCredential.from_scripthash(CardanoWasm.ScriptHash.from_hex(groupInfoParams[contractsMgr.GroupNFT.StkVh]))).to_address().to_bech32(ADDR_PREFIX);
            // console.log(utils.addressType(baseAddr));
            const o = await crossTransfer(baseAddr, '', 0, 2000000, mode);
            // const o = await crossTransfer(baseAddr, 'e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72.4d494e', 2000000, 2000000, mode);
            // const o = await crossTransfer(baseAddr, '343ac71f7f3b2dbd4efa1e9735c2ac2cb7ae777d5325db23d9f77332.616263', 0, 2000000, mode);
        }
        // return;
        // const o5 = await crossTransfer(TreasuryScriptAddress.to_bech32(ADDR_PREFIX), '', 0, 2000000, mode);

        if (tokenId != '') {
            const minAda = utils.getMinAdaOfUtxo(protocolParamsGlobal, to, { coins: 1000000, assets: { [tokenId]: 2000000 } }, utils.genDemoDatum42());
            // const o2 = await crossTransfer(to, tokenId, 2000000, 2000000/*minAda*/, mode);
            // const o3 = await foundationTransfer(adminNext,tokenId,mode);
            // const o = await crossTransfer('addr_test1qpstydtgjfyavqecas5w730m86tltgl3ask2xsl3hfl2vw9ng88pgc8c4mh3tx0mpm2es8e54w86rvat6de0nmgec5ast965pg', '', 0, 3000000, mode);
            // const o4 = await crossTransfer(TreasuryScriptAddress.to_bech32(ADDR_PREFIX), tokenId, 2000000, minAda, mode);
        }
        // return;

        if (params[contractsMgr.GroupNFT.MintCheckVH].toLowerCase() != contracts.MintCheckScript.script().hash().to_hex().toLowerCase()) {
            console.log('old MintCheckVH:', params[contractsMgr.GroupNFT.MintCheckVH].toLowerCase());
            console.log('new MintCheckVH:', contracts.MintCheckScript.script().hash().to_hex().toLowerCase());
            await setMintCheckVH(contracts.MintCheckScript.script().hash().to_hex());
        }

        // return;



        const amount = 1200000;



        const namiAddr = 'addr_test1qpstydtgjfyavqecas5w730m86tltgl3ask2xsl3hfl2vw9ng88pgc8c4mh3tx0mpm2es8e54w86rvat6de0nmgec5ast965pg';
        // await mintMappingToken(namiAddr, mappingTokenNameWan, 14607654322, mode);
        // await mintMappingToken(namiAddr, mappingTokenNameWasp, 38488744405, mode);
        // await mintMappingToken(baseAddr, mappingTokenNameWan, amount * 2, mode);
        const burnUtxos = await getMappingTokenUtxo(adminNext, mappingTokenNameWan, amount * 2);
        if (burnUtxos.length <= 0) {
            let o2 = await mintMappingToken(adminNext, mappingTokenNameWan, amount * 2, mode);
            // o2 = await mintMappingToken(adminNext, mappingTokenName, amount/2, contracts.TreasuryScript.MODE_ED25519);
        }

        const o3 = await burnMappingToken(mappingTokenNameWan, amount);

    }
}

async function sleep(ms = 10000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve() }, ms);
    })
}

function genMetaData(params) {
    let auxiliaryData = CardanoWasm.AuxiliaryData.new();

    const buildMetaDataByJson = function (type, tokenPair, txHash) {
        let itemValue = {
            "type": type,
            "tokenPairID": tokenPair,
            "uniqueId": txHash
        };

        let obj = {
            5718350: itemValue
        }

        let metadata = CardanoWasm.encode_json_str_to_metadatum(JSON.stringify(obj), CardanoWasm.MetadataJsonSchema.BasicConversions);
        return metadata;
    }

    let rawMetaData = buildMetaDataByJson(params.type, params.tokenPairId, params.fromTxHash);
    let genMetaData = CardanoWasm.GeneralTransactionMetadata.from_bytes(rawMetaData.to_bytes());

    auxiliaryData.set_metadata(genMetaData);
    return auxiliaryData;
}

// const dff = 'd8799f581c60b235689249d60338ec28ef45fb3e97f5a3f1ec2ca343f1ba7ea6384040001a001e84805820d33d9d7256be1748b182f49c62461965a766e3f00d97780f1e1fa73070f6e4a40002582012345678901234567890123456789012123456789012345678901234567890120058407150302b8ff7b528cc7ffa7a7ad845384b6fade89dd0246dac68fcd7b55944da8750912e2cbb09e1c7fa5993f4949e07e9dbc161706d7b520153f5d36f7bce0eff';
// console.log(contracts.TreasuryScript.getRedeemerFromCBOR(dff));
// console.log(contractsMgr.AdminNFTHolderScript.genRedeemerData(contractsMgr.AdminNFTHolderScript.Update).to_json());


main().then(() => {

    console.log('______ Byebye ________')
    // console.log('===== :', CardanoWasm.__wasm.memory.buffer.byteLength,CardanoWasm.count);
    if (global.gc) global.gc();
    sleep(1000).then(() => {
        // CardanoWasm.__wasm.memory.grow(-1);
        CardanoWasm.outGCMap();
        console.log('===== :', CardanoWasm.__wasm.memory.buffer.byteLength);
        process.exit();
    })

}).catch(e => {
    console.error(e);
    for (let i = 0; i < e.length; i++) {
        const err = e[i];
        console.error(err.stack);
    }
    ogmiosUtils.unInit();

})

