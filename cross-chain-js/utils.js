const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');

module.exports.initProtocolParams = function (protocolParams, interVia = 'ogmios') {
    if (interVia == 'ogmios') {
        const linearFee = CardanoWasm.LinearFee.new(
            CardanoWasm.BigNum.from_str('' + protocolParams.minFeeCoefficient),//(protocolParams.linearFee.minFeeA),
            CardanoWasm.BigNum.from_str('' + protocolParams.minFeeConstant)//(protocolParams.linearFee.minFeeB)
        );

        const memPriceParams = protocolParams.prices.memory.split('/');
        const stepPriceParams = protocolParams.prices.steps.split('/');
        const exUnitPrice = CardanoWasm.ExUnitPrices.new(
            CardanoWasm.UnitInterval.new(CardanoWasm.BigNum.from_str(memPriceParams[0]), CardanoWasm.BigNum.from_str(memPriceParams[1]))
            , CardanoWasm.UnitInterval.new(CardanoWasm.BigNum.from_str(stepPriceParams[0]), CardanoWasm.BigNum.from_str(stepPriceParams[1])))


        if (!protocolParams.coinsPerUtxoByte) {
            return CardanoWasm.TransactionBuilderConfigBuilder.new()
                .fee_algo(linearFee)
                .pool_deposit(CardanoWasm.BigNum.from_str(protocolParams.poolDeposit + ''))//('500000000'))
                .key_deposit(CardanoWasm.BigNum.from_str(protocolParams.stakeKeyDeposit + ''))//('2000000'))
                .max_value_size(+protocolParams.maxValueSize)//(4000)
                .max_tx_size(+protocolParams.maxTxSize)//(8000)
                .coins_per_utxo_word(CardanoWasm.BigNum.from_str(protocolParams.coinsPerUtxoWord + ''))
                .ex_unit_prices(exUnitPrice)
                .build();
        } else {
            return CardanoWasm.TransactionBuilderConfigBuilder.new()
                .fee_algo(linearFee)
                .pool_deposit(CardanoWasm.BigNum.from_str(protocolParams.poolDeposit + ''))//('500000000'))
                .key_deposit(CardanoWasm.BigNum.from_str(protocolParams.stakeKeyDeposit + ''))//('2000000'))
                .max_value_size(+protocolParams.maxValueSize)//(4000)
                .max_tx_size(+protocolParams.maxTxSize)//(8000)
                .coins_per_utxo_byte(CardanoWasm.BigNum.from_str(protocolParams.coinsPerUtxoByte + ''))
                .ex_unit_prices(exUnitPrice)
                .build();
        }
    } else {
        const linearFee = CardanoWasm.LinearFee.new(
            CardanoWasm.BigNum.from_str('' + protocolParams.min_fee_a),//(protocolParams.linearFee.minFeeA),
            CardanoWasm.BigNum.from_str('' + protocolParams.min_fee_b)//(protocolParams.linearFee.minFeeB)
        );

        const memPriceParams = protocolParams.prices.memory.split('/');
        const stepPriceParams = protocolParams.prices.steps.split('/');
        const exUnitPrice = CardanoWasm.ExUnitPrices.new(
            CardanoWasm.UnitInterval.new(CardanoWasm.BigNum.from_str(memPriceParams[0]), CardanoWasm.BigNum.from_str(memPriceParams[1]))
            , CardanoWasm.UnitInterval.new(CardanoWasm.BigNum.from_str(stepPriceParams[0]), CardanoWasm.BigNum.from_str(stepPriceParams[1])))


        return CardanoWasm.TransactionBuilderConfigBuilder.new()
            .fee_algo(linearFee)
            .pool_deposit(CardanoWasm.BigNum.from_str(protocolParams.pool_deposit))//('500000000'))
            .key_deposit(CardanoWasm.BigNum.from_str(protocolParams.key_deposit))//('2000000'))
            .max_value_size(+protocolParams.max_val_size)//(4000)
            .max_tx_size(+protocolParams.max_tx_size)//(8000)
            .coins_per_utxo_byte(CardanoWasm.BigNum.from_str(protocolParams.coins_per_utxo_size))
            .ex_unit_prices(exUnitPrice)
            .build();
    }

}

module.exports.initTxBuilder = function (protocolParams) {
    const txBuilderCfg = this.initProtocolParams(protocolParams);
    // Step2: new TransactionBuilder with paramsconfig
    return CardanoWasm.TransactionBuilder.new(txBuilderCfg);
}

module.exports.createScriptRef = async function (protocolParams, utxtos, changeAddr, ownerAddr, script, signFn) {

    const txBuilder = this.initTxBuilder(protocolParams);

    const txInputBuilder = CardanoWasm.TxInputsBuilder.new();
    for (let i = 0; i < utxtos.length; i++) {
        const utxoForFee = utxtos[i];
        const txId = CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxoForFee.txHash, 'hex'));
        const input = CardanoWasm.TransactionInput.new(txId, utxoForFee.index);
        const value = this.funValue(utxoForFee.value);
        const from = CardanoWasm.Address.from_bech32(utxoForFee.address);
        txInputBuilder.add_input(from, input, value);
        // const fee = txBuilder.fee_for_input(from, input, value);
        // allFee = allFee.checked_add(fee);
    }

    const minimumAda = this.getMinAdaOfUtxo(protocolParams, ownerAddr, { coins: 1000000, assets: {} }, undefined, script);
    const value = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('' + minimumAda));
    const output = CardanoWasm.TransactionOutput.new(CardanoWasm.Address.from_bech32(ownerAddr), value);
    const scriptRef = CardanoWasm.ScriptRef.new_plutus_script(script);
    output.set_script_ref(scriptRef);


    txBuilder.set_inputs(txInputBuilder);
    txBuilder.add_output(output);
    // const addr = CardanoWasm.Address.from_bech32(admin);
    // const baseAddr = CardanoWasm.BaseAddress.from_address(addr);
    // txBuilder.add_required_signer(baseAddr.payment_cred().to_keyhash());
    txBuilder.add_change_if_needed(CardanoWasm.Address.from_bech32(changeAddr));


    const body = txBuilder.build_tx().body();
    let txBodyHash = CardanoWasm.hash_transaction(body);

    const transactionWitnessSet = CardanoWasm.TransactionWitnessSet.new();
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    const signResult = await signFn(txBodyHash.to_hex());
    vkeyWitnesses.add(CardanoWasm.Vkeywitness.from_json(JSON.stringify(signResult)));
    transactionWitnessSet.set_vkeys(vkeyWitnesses);

    const signedTx = CardanoWasm.Transaction.new(
        body,
        transactionWitnessSet
    );

    return signedTx;
}


module.exports.transfer = async (protocolParams, utxtoInputs, to, funValue, changeAddr, datum, script, signFn) => {
    const txBuilder = this.initTxBuilder(protocolParams);
    const txInputBuilder = CardanoWasm.TxInputsBuilder.new();
    for (let i = 0; i < utxtoInputs.length; i++) {
        const utxo = utxtoInputs[i];
        const txId = CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.txHash, 'hex'));
        const input = CardanoWasm.TransactionInput.new(txId, utxo.index);
        const value = this.funValue(utxo.value);
        const from = CardanoWasm.Address.from_bech32(utxo.address);
        txInputBuilder.add_input(from, input, value);
    }

    const minimumAda = this.getMinAdaOfUtxo(protocolParams, to, funValue, datum, script);
    if (minimumAda > funValue.coins * 1) throw `output coins is to small ,required minimum is ${minimumAda}, actual value is ${funValue.coins}`;

    const value = this.funValue(funValue);
    const output = CardanoWasm.TransactionOutput.new(CardanoWasm.Address.from_bech32(to), value);
    if (datum) {
        output.set_plutus_data(datum);
    }

    if (script) {
        const scriptRef = CardanoWasm.ScriptRef.new_plutus_script(script);
        output.set_script_ref(scriptRef);
    }


    txBuilder.set_inputs(txInputBuilder);
    txBuilder.add_output(output);
    txBuilder.add_change_if_needed(CardanoWasm.Address.from_bech32(changeAddr));


    const body = txBuilder.build_tx().body();
    let txBodyHash = CardanoWasm.hash_transaction(body);

    const transactionWitnessSet = CardanoWasm.TransactionWitnessSet.new();
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    const signResult = await signFn(txBodyHash.to_hex());
    vkeyWitnesses.add(CardanoWasm.Vkeywitness.from_json(JSON.stringify(signResult)));
    transactionWitnessSet.set_vkeys(vkeyWitnesses);

    const signedTx = CardanoWasm.Transaction.new(
        body,
        transactionWitnessSet
    );

    return signedTx;
}

module.exports.getMinAdaOfUtxo = function (protocolParams, owner, value, datum, refScript) {

    const mutiAsset = CardanoWasm.MultiAsset.new();
    let checkedValue = value;
    if (!(value instanceof CardanoWasm.Value)) {
        if (!value.assets) value.assets = {}
        for (const tokenId in value.assets) {
            const [policy_id, tokenName] = tokenId.split('.');
            const assetName = CardanoWasm.AssetName.new(Buffer.from(tokenName, 'hex'));

            const asset = CardanoWasm.Assets.new();
            asset.insert(assetName, CardanoWasm.BigNum.from_str('' + value.assets[tokenId]));
            mutiAsset.insert(CardanoWasm.ScriptHash.from_hex(policy_id), asset);
        }

        const minAdaWithToken = 1000000 + 1 * (value.coins ? value.coins : 0);//1672280
        checkedValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(minAdaWithToken + ''));
        checkedValue.set_multiasset(mutiAsset);
    } else {
        // console.log(value.to_json());
        if (value.coin().less_than(CardanoWasm.BigNum.from_str('1000000'))) {
            // console.log('=====>',value.coin().to_str());
            value.set_coin(CardanoWasm.BigNum.from_str('1000000'));
        }
    }

    // console.log(typeof owner);
    let ownerAddr = owner;
    if (!(owner instanceof CardanoWasm.Address)) {
        ownerAddr = CardanoWasm.Address.from_bech32(owner);
    }
    // console.log('ownerAddr=',ownerAddr.to_bech32());
    const output = CardanoWasm.TransactionOutput.new(ownerAddr, checkedValue);

    if (datum) output.set_plutus_data(datum);


    if (refScript) {
        output.set_script_ref(CardanoWasm.ScriptRef.new_plutus_script(refScript));
    }
    // console.log(output.to_json());
    // console.log('size=',output.to_bytes().byteLength+160);

    return (160 + output.to_bytes().byteLength) * protocolParams.coinsPerUtxoByte
}


module.exports.datum42 = function () {
    const ls = CardanoWasm.PlutusList.new();
    ls.add(CardanoWasm.PlutusData.new_integer(CardanoWasm.BigInt.from_str('1')));
    return ls;
}
//{"constructor":0,"fields":[{"int":42}]}
module.exports.genDemoDatum42 = function () {
    // const ls = CardanoWasm.PlutusList.new();
    // ls.add(CardanoWasm.PlutusData.new_integer(CardanoWasm.BigInt.from_str('1')));
    return CardanoWasm.PlutusData.new_constr_plutus_data(
        CardanoWasm.ConstrPlutusData.new(
            CardanoWasm.BigNum.from_str('0'),
            this.datum42()
        )
    )
}

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

module.exports.genSwapContraitCDatum = function (inTokenAmount, outTokenAmountMin) {
    const ls = CardanoWasm.PlutusList.new();
    ls.add(CardanoWasm.PlutusData.new_integer(CardanoWasm.BigInt.from_str(inTokenAmount + '')));
    ls.add(CardanoWasm.PlutusData.new_integer(CardanoWasm.BigInt.from_str(outTokenAmountMin + '')));
    return CardanoWasm.PlutusData.new_constr_plutus_data(
        CardanoWasm.ConstrPlutusData.new(
            CardanoWasm.BigNum.from_str('0'),
            ls
        )
    )
}

module.exports.getCrossInfoFromCBOR = function (cbor) {
    const redeemer = CardanoWasm.PlutusData.from_hex(cbor);
    const parmsLs = redeemer.as_constr_plutus_data().data();

    const uniqueId = Buffer.from(parmsLs.get(0).as_bytes()).toString('hex');

    const inPairId = parmsLs.get(1).as_integer().as_int().as_i32();
    const outPairId = parmsLs.get(2).as_integer().as_int().as_i32();
    const receiver = Buffer.from(parmsLs.get(3).as_bytes()).toString('hex');

    const feeADA = parmsLs.get(4).as_integer().as_int().as_i32();
    const inTokenCurrency = Buffer.from(parmsLs.get(5).as_bytes()).toString('hex');
    const inTokenName = Buffer.from(parmsLs.get(6).as_bytes()).toString('hex');
    const inTokenMode = parmsLs.get(7).as_integer().as_int().as_i32();
    const outTokenCurrency = Buffer.from(parmsLs.get(8).as_bytes()).toString('hex');
    const outTokenName = Buffer.from(parmsLs.get(9).as_bytes()).toString('hex');
    const outTokenMode = parmsLs.get(10).as_integer().as_int().as_i32();

    const constraintCBOR = Buffer.from(parmsLs.get(11).as_bytes()).toString('hex');

    return {
        uniqueId, inPairId, outPairId, receiver, feeADA
        , inToken: inTokenCurrency + '.' + inTokenName, inTokenMode
        , outToken: outTokenCurrency + '.' + outTokenName, outTokenMode, constraintCBOR
    }

}

module.exports.genCrossDatum = function (info) {
    const ls = CardanoWasm.PlutusList.new();

    ls.add(CardanoWasm.PlutusData.new_bytes(Buffer.from(info.uniqueId, 'hex')));

    ls.add(CardanoWasm.PlutusData.new_integer(CardanoWasm.BigInt.from_str(info.inPairId + '')));
    ls.add(CardanoWasm.PlutusData.new_integer(CardanoWasm.BigInt.from_str(info.outPairId + '')));
    ls.add(CardanoWasm.PlutusData.new_bytes(Buffer.from(info.receiver, 'hex')));

    let [inTokenCurrency, inTokenName] = ['', ''];
    if (info.inToken != '') {
        [inTokenCurrency, inTokenName] = info.inToken.split('.');
    }
    ls.add(CardanoWasm.PlutusData.new_integer(CardanoWasm.BigInt.from_str(info.feeADA + '')));
    ls.add(CardanoWasm.PlutusData.new_bytes(Buffer.from(inTokenCurrency, 'hex')));
    ls.add(CardanoWasm.PlutusData.new_bytes(Buffer.from(inTokenName, 'hex')));
    ls.add(CardanoWasm.PlutusData.new_integer(Buffer.from(info.inTokenMode, 'hex')));

    let [outTokenCurrency, outTokenName] = ['', ''];
    if (info.outToken != '') {
        [outTokenCurrency, outTokenName] = info.outToken.split('.');
    }
    ls.add(CardanoWasm.PlutusData.new_bytes(Buffer.from(outTokenCurrency, 'hex')));
    ls.add(CardanoWasm.PlutusData.new_bytes(Buffer.from(outTokenName, 'hex')));
    ls.add(CardanoWasm.PlutusData.new_integer(Buffer.from(info.outTokenMode, 'hex')));

    ls.add(CardanoWasm.PlutusData.new_bytes(Buffer.from(info.constraintCBOR, 'hex')));



    return CardanoWasm.PlutusData.new_constr_plutus_data(
        CardanoWasm.ConstrPlutusData.new(
            CardanoWasm.BigNum.from_str('0'),
            ls
        )
    )
}

module.exports.funValue = function (valueMap) {
    const mutiAsset = CardanoWasm.MultiAsset.new();


    const policyAssets = {}

    for (const assetId in valueMap.assets) {
        const assetValue = valueMap.assets[assetId];
        if (assetValue * 1 == 0) continue;
        let [policy_id, assetName] = assetId.split('.');

        let assets = policyAssets[policy_id];
        if (!assets) {
            assets = CardanoWasm.Assets.new();
            policyAssets[policy_id] = assets
        }
        if (!assetName) assetName = '';
        assets.insert(CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex')), CardanoWasm.BigNum.from_str('' + assetValue));
    }
    for (const policy_id in policyAssets) {
        const assets = policyAssets[policy_id];
        mutiAsset.insert(CardanoWasm.ScriptHash.from_hex(policy_id), assets);
    }

    // console.log(mutiAsset.to_json());

    let value = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('' + (valueMap.coins ? valueMap.coins : 0)));
    if (mutiAsset.len() > 0) value.set_multiasset(mutiAsset);
    // console.log(value.to_json());
    return value;
}

module.exports.addressToPkhOrScriptHash = function (addrStr) {
    const tmp = CardanoWasm.Address.from_bech32(addrStr);
    let toAddrBase = CardanoWasm.BaseAddress.from_address(tmp);
    if (!toAddrBase) toAddrBase = CardanoWasm.EnterpriseAddress.from_address(tmp);
    switch (toAddrBase.payment_cred().kind()) {
        case 0:
            return toAddrBase.payment_cred().to_keyhash().to_hex();
            break;
        case 1:
            return toAddrBase.payment_cred().to_scripthash().to_hex();
        default:
            throw 'unexpected kind type:' + toAddrBase.payment_cred().kind()
            break;
    }
}

module.exports.addressType = function (addrStr) {
    const tmp = CardanoWasm.Address.from_bech32(addrStr);
    let toAddrBase = CardanoWasm.BaseAddress.from_address(tmp);
    if (!toAddrBase) toAddrBase = CardanoWasm.EnterpriseAddress.from_address(tmp);
    return toAddrBase.payment_cred().kind();
}

module.exports.addressTypeCode = function (addrStr) {
    /*
    ; 0000: base address: keyhash28,keyhash28
    ; 0001: base address: scripthash28,keyhash28
    ; 0010: base address: keyhash28,scripthash28
    ; 0011: base address: scripthash28,scripthash28
    ; 0100: pointer address: keyhash28, 3 variable length uint
    ; 0101: pointer address: scripthash28, 3 variable length uint
    ; 0110: enterprise address: keyhash28
    ; 0111: enterprise address: scripthash28
    ; 1000: byron address
    ; 1110: reward account: keyhash28
    ; 1111: reward account: scripthash28
    ; 1001 - 1101: future formats
    */
    const tmp = CardanoWasm.Address.from_bech32(addrStr);
    const typeCode = tmp.to_hex().slice(0, 1);
    // console.log(tmp.to_hex().slice(0, 4))
    return typeCode
}


//TODO: 
module.exports.addressToHashs = function (addrStr) {
    const tmp = CardanoWasm.Address.from_bech32(addrStr);
    let toAddrBase = CardanoWasm.BaseAddress.from_address(tmp);
    let ret = {};
    if (!toAddrBase) {
        toAddrBase = CardanoWasm.EnterpriseAddress.from_address(tmp);
    } else {
        const stake_cred = toAddrBase.stake_cred();
        switch (stake_cred.kind()) {
            case 0:
                ret.pkhStk = stake_cred.to_keyhash().to_hex();
                break;
            case 1:
                ret.pkhStk = stake_cred.to_scripthash().to_hex();
            default:
                break;
        }
    }

    switch (toAddrBase.payment_cred().kind()) {
        case 0:
            ret.pkhPay = toAddrBase.payment_cred().to_keyhash().to_hex();
            break;
        case 1:
            ret.pkhPay = toAddrBase.payment_cred().to_scripthash().to_hex();
            break;
        default:
            throw 'unexpected kind type:' + toAddrBase.payment_cred().kind();
            break;
    }

    return ret;
}


module.exports.fixTxExuintByEvaluate = async function (protocolParams, txRaw, evaluate, signTx, gasMutipl = 1) {
    const exUnitEVA = await evaluate(txRaw);
    console.log(exUnitEVA);
    if(!exUnitEVA) throw 'evalaute failed';

    let total_ex_mem = 0;
    let total_ex_cpu = 0;

    for (const key in exUnitEVA) {
        const exUnit = exUnitEVA[key];
        total_ex_mem += Math.floor(exUnit.memory * gasMutipl);
        total_ex_cpu += Math.floor(exUnit.steps * gasMutipl);
    }

    if (protocolParams.maxExecutionUnitsPerTransaction.memory < total_ex_mem || protocolParams.maxExecutionUnitsPerTransaction.steps < total_ex_cpu) {
        throw `ExUnit too large: memory:${total_ex_mem} ,steps:${total_ex_cpu}`;
    }
    let tx = CardanoWasm.Transaction.from_hex(txRaw);
    let witnessSset;
    {
        if (tx.witness_set()) {
            witnessSset = tx.witness_set();
        } else {
            witnessSset = CardanoWasm.TransactionWitnessSet.new();
        }

        let vks = witnessSset.vkeys();
        if (!vks) {
            vks = CardanoWasm.Vkeywitnesses.new();
        }
        let aa = 0;
        if (tx.body().required_signers()) {
            aa = tx.body().required_signers().len();
        }
        let bb = vks.len();

        for (let i = aa - bb; i > 0; i--) {
            const vk = CardanoWasm.Vkeywitness.new(
                CardanoWasm.Vkey.new(CardanoWasm.PublicKey.from_hex('cbc623254ca1eb30d8cb21b2ef04381372ff24539a74e4b5117d1e3bbb0f0188')),
                CardanoWasm.Ed25519Signature.from_hex('b31d2a51199f1c47f1d3f10e7a4b68bf717ded8d8e0346b8d37a2e44a02088ac62f6ea82b0b13fda81da242c92def5b5fadb3e7e16459897f000b1bd4e09a30b')
            );
            vks.add(vk);
            // console.log('*******2', vks.to_json());
        }
        witnessSset.set_vkeys(vks);

        tx = CardanoWasm.Transaction.new(
            tx.body(), witnessSset, tx.auxiliary_data()
        )
        // console.log('&&&&&&&2', tx.to_json());
    }
    const redeemers = witnessSset.redeemers();
    const redeemersNew = CardanoWasm.Redeemers.new();
    for (let i = 0; i < redeemers.len(); i++) {
        const redeemer = redeemers.get(i);
        const tag = redeemer.tag();
        const index = redeemer.index();
        const redeemerData = redeemer.data();

        let tagStr = '';
        switch (tag.kind()) {
            case CardanoWasm.RedeemerTagKind.Spend:
                tagStr = 'spend:' + index.to_str();
                break;
            case CardanoWasm.RedeemerTagKind.Mint:
                tagStr = 'mint:' + index.to_str();
                break;
            case CardanoWasm.RedeemerTagKind.Cert:
                tagStr = 'cert:' + index.to_str();
                break;
            case CardanoWasm.RedeemerTagKind.Reward:
                tagStr = 'reward:' + index.to_str();
                break;
            default:
                break;
        }
        let ex_unit_mem = Math.floor(exUnitEVA[tagStr].memory * gasMutipl);
        let ex_unit_cpu = Math.floor(exUnitEVA[tagStr].steps * gasMutipl);
        const exUint = CardanoWasm.ExUnits.new(CardanoWasm.BigNum.from_str(ex_unit_mem + ''), CardanoWasm.BigNum.from_str(ex_unit_cpu + ''));

        const redeemerNew = CardanoWasm.Redeemer.new(
            tag, index, redeemerData, exUint
        );
        redeemersNew.add(redeemerNew);
    }


    const memPriceParams = protocolParams.prices.memory.split('/');
    const stepPriceParams = protocolParams.prices.steps.split('/');

    const exUnitPrice = CardanoWasm.ExUnitPrices.new(
        CardanoWasm.UnitInterval.new(CardanoWasm.BigNum.from_str(memPriceParams[0]), CardanoWasm.BigNum.from_str(memPriceParams[1]))
        , CardanoWasm.UnitInterval.new(CardanoWasm.BigNum.from_str(stepPriceParams[0]), CardanoWasm.BigNum.from_str(stepPriceParams[1])));

    const totalExUnits = CardanoWasm.ExUnits.new(CardanoWasm.BigNum.from_str(total_ex_mem + ''), CardanoWasm.BigNum.from_str(total_ex_cpu + ''));
    const plutusCost = CardanoWasm.calculate_ex_units_ceil_cost(totalExUnits, exUnitPrice);

    const txfeeWithoutPlutus = CardanoWasm.BigNum.from_str('' + protocolParams.minFeeCoefficient).checked_mul(
        CardanoWasm.BigNum.from_str('' + tx.to_bytes().byteLength)
    ).checked_add(CardanoWasm.BigNum.from_str('' + protocolParams.minFeeConstant));

    const total_fee = plutusCost.checked_add(txfeeWithoutPlutus);
    console.log('txfeeWithoutPlutus=', txfeeWithoutPlutus.to_str());
    console.log('plutusCost=', plutusCost.to_str());
    console.log('total_fee=', total_fee.to_str());

    let collaterOwnerAddress = tx.body().collateral_return().address();

    const oldFee = tx.body().fee();
    // const feeGap = total_fee;
    console.log('collaterOwnerAddress address:',collaterOwnerAddress.to_hex())
    let outputsFinal = CardanoWasm.TransactionOutputs.new();
    for (let i = 0; i < tx.body().outputs().len(); i++) {
        const output = tx.body().outputs().get(i);
        console.log('output address:',output.address().to_hex())
        if (output.address().to_hex() == collaterOwnerAddress.to_hex()) {
            let newCoin = output.amount().coin();
            if(oldFee.less_than(total_fee)){
                newCoin = newCoin.checked_sub(total_fee.checked_sub(oldFee));
            }else{
                newCoin = newCoin.checked_add(oldFee.checked_sub(total_fee));
            }

            const newValue = CardanoWasm.Value.new(newCoin);
            if(output.amount().multiasset()) newValue.set_multiasset(output.amount().multiasset());
            const newOutput = CardanoWasm.TransactionOutput.new(output.address(), newValue);
            outputsFinal.add(newOutput);
            console.log('old output',output.to_json())
            console.log('new output',newOutput.to_json())
        } else {
            console.log('no change output',output.to_json())
            outputsFinal.add(output);
        }
    }

    const newBody = CardanoWasm.TransactionBody.new(tx.body().inputs(), outputsFinal, total_fee, tx.body().ttl());
    if (tx.body().auxiliary_data_hash()) newBody.set_auxiliary_data_hash(tx.body().auxiliary_data_hash());
    if (tx.body().certs()) newBody.set_certs(tx.body().certs());
    newBody.set_collateral(tx.body().collateral());


    // const txCollateralInputBuilder = CardanoWasm.TxInputsBuilder.new();
    // for (let i = 0; i < tx.body().collateral().len(); i++) {
    //     const utxoCollateral = tx.body().collateral().get(i);

    //     txCollateralInputBuilder.add_input(utxoCollateral.);
    // }
    // // newBody.set_collateral(txCollateralInputBuilder.inputs());
    // newBody.set_collateral(tx.body().collateral());

    // const totalCollateraInputlValue = txCollateralInputBuilder.total_value();
    const totalCollateraInputlValue = CardanoWasm.Value.new(tx.body().total_collateral()).checked_add(tx.body().collateral_return().amount());
    const collateralValue = CardanoWasm.Value.new(total_fee.checked_mul(CardanoWasm.BigNum.from_str('2')));
    // console.log('totalCollateraInputlValue:', totalCollateraInputlValue.to_json());
    // console.log('collateralValue:', collateralValue.to_json());
    const collateralReturnValue = totalCollateraInputlValue.checked_sub(collateralValue);
    const collateralOutput = CardanoWasm.TransactionOutput.new(collaterOwnerAddress, collateralReturnValue);

    newBody.set_collateral_return(collateralOutput);
    newBody.set_total_collateral(collateralValue.coin());
    if (tx.body().reference_inputs())
        newBody.set_reference_inputs(tx.body().reference_inputs());

    if (tx.body().required_signers())
        newBody.set_required_signers(tx.body().required_signers());

    const costModesLib = protocolParams.costModels;//getCostModels(protocolParams);
    const tmp = CardanoWasm.Costmdls.new();
    tmp.insert(CardanoWasm.Language.new_plutus_v2(), costModesLib.get(CardanoWasm.Language.new_plutus_v2()));
    const hash = CardanoWasm.hash_script_data(redeemersNew, tmp);
    newBody.set_script_data_hash(hash);
    if (tx.body().update()) newBody.set_update(tx.body().update());
    if (tx.body().validity_start_interval()) newBody.set_validity_start_interval(tx.body().validity_start_interval());
    if (tx.body().validity_start_interval_bignum()) newBody.set_validity_start_interval_bignum(tx.body().validity_start_interval_bignum());

    if (tx.body().withdrawals()) newBody.set_withdrawals(tx.body().withdrawals());
    if (tx.body().network_id()) newBody.set_network_id(tx.body().network_id());
    if (tx.body().mint()) newBody.set_mint(tx.body().mint());
    if (tx.body().auxiliary_data_hash()) newBody.set_auxiliary_data_hash(tx.body().auxiliary_data_hash());

    witnessSset.set_redeemers(redeemersNew);
    if (tx.witness_set().plutus_data()) witnessSset.set_plutus_data(tx.witness_set().plutus_data());
    {
        const tmptx = CardanoWasm.Transaction.from_hex(txRaw);
        const witnessVks = CardanoWasm.Vkeywitnesses.new();

        const oldWitnessVks = tmptx.witness_set().vkeys();
        const { vkey, signature } = await signTx(CardanoWasm.hash_transaction(newBody).to_hex());
        const vkeyWitnessTmp = CardanoWasm.Vkeywitness.from_json(JSON.stringify({ vkey, signature }));
        for (let i = 0; i < oldWitnessVks.len(); i++) {
            const witnessVkOld = oldWitnessVks.get(i);
            const vk = witnessVkOld.vkey().to_hex();
            if (vk == vkeyWitnessTmp.vkey().to_hex()) {
                const replaceVKWitness = CardanoWasm.Vkeywitness.new(witnessVkOld.vkey(), CardanoWasm.Ed25519Signature.from_hex(signature));
                witnessVks.add(replaceVKWitness);
                console.log(replaceVKWitness.to_json());
            } else {
                witnessVks.add(witnessVkOld);
            }
        }
        witnessSset.set_vkeys(witnessVks);
    }



    if (tx.witness_set().plutus_scripts()) witnessSset.set_plutus_scripts(tx.witness_set().plutus_scripts());
    if (tx.witness_set().bootstraps()) witnessSset.set_bootstraps(tx.witness_set().bootstraps());
    if (tx.witness_set().native_scripts()) witnessSset.set_native_scripts(tx.witness_set().native_scripts());

    const newTx = CardanoWasm.Transaction.new(newBody, witnessSset, tx.auxiliary_data());

    return newTx;
}



module.exports.genNFTAssetName = function (name, typeCode) {

    function crc8(buffer) {
        let crc = 0x00;
        for (let i = 0; i < buffer.length; i++) {
            crc ^= buffer[i];
            for (let j = 0; j < 8; j++) {
                if (crc & 0x80) {
                    crc = (crc << 1) ^ 0x07;
                } else {
                    crc = crc << 1;
                }
            }
        }
        return crc & 0xff;
    }

    const buffer = Buffer.alloc(2); // 需要计算CRC-8的数据
    buffer.writeUint16BE(typeCode)
    console.log(buffer.toString('hex'));
    const crcValue = crc8(buffer);
    const label = '0' + buffer.toString('hex') + crcValue.toString(16).padStart(2, '0') + '0'
    return label + Buffer.from(name, 'ascii').toString('hex');
}