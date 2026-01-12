import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function burnLiquidity(
    amountLp: number,
    burnedLpExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "exchange",
        "burn-liquidity",
        [Cl.uint(amountLp)],
        sender
    );

    if (amountLp <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) {
            console.log(`☑️ Zero amount LP: Expected ERR_ZERO_AMOUNT (700) - burn-liquidity result:`, test.result);
        }
        return 0;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Burn liquidity failed with error: ${errorCode}`);
        }
        return 0;
    }
    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "burned-lp": Cl.uint(burnedLpExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Burn liquidity successful: ${amountLp} LP burned`);
        const resultValue = (test.result as any).value;
        console.log("burn-liquidity result:", JSON.stringify(resultValue, null, 2));
    }

    return burnedLpExpected;
}

export function lockLiquidity(
    amountA: number,
    lockedAExpected: number,
    lockedBExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "exchange",
        "lock-liquidity",
        [Cl.uint(amountA)],
        sender
    );
    if (amountA <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) {
            console.log(`☑️ Zero amount A: Expected ERR_ZERO_AMOUNT (700) - lock-liquidity result:`, test.result);
        }
        return 0;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Lock liquidity failed with error: ${errorCode}`);
        }
        return 0;
    }
    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "locked-a": Cl.uint(lockedAExpected),
                "locked-b": Cl.uint(lockedBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Lock liquidity successful: ${amountA} WELSH locked`);
        console.log("lock-liquidity result:");

        const resultValue = (test.result as any).value.value;
        console.log(`  locked-a: ${Number(resultValue['locked-a'].value)}`);
        console.log(`  locked-b: ${Number(resultValue['locked-b'].value)}`);
    }

    return {lockedAExpected, lockedBExpected};
}

export function provideInitialLiquidity(
    amountA: number,
    amountB: number,
    addedAExpected: number,
    addedBExpected: number,
    mintedLpExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "exchange",
        "provide-initial-liquidity",
        [Cl.uint(amountA), Cl.uint(amountB)],
        sender
    );

    if (amountA <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) {
            console.log(`☑️ Zero amount A: Expected ERR_ZERO_AMOUNT (700) - provide-initial-liquidity result:`, test.result);
        }
        return 0;
    }

    if (amountB <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) {
            console.log(`☑️ Zero amount B: Expected ERR_ZERO_AMOUNT (700) - provide-initial-liquidity result:`, test.result);
        }
        return 0;
    }
    if (sender != deployer) {
        expect(test.result).toEqual(Cl.error(Cl.uint(701)));
        if (disp) {
            console.log(`☑️ Unauthorized sender: Expected ERR_NOT_CONTRACT_OWNER (701) - provide-initial-liquidity result:`, test.result);
        }
        return 0;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Provide initial liquidity failed with error: ${errorCode}`);
        }
        return 0;
    }
    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "added-a": Cl.uint(addedAExpected),
                "added-b": Cl.uint(addedBExpected),
                "minted-lp": Cl.uint(BigInt(mintedLpExpected)),
            })
        )
    );
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Provide initial liquidity successful: ${amountA} WELSH + ${amountB} STREET → ${mintedLpExpected} LP`);
        const resultValue = (test.result as any).value;
        console.log("provide-initial-liquidity result:", resultValue);
    }
    return mintedLpExpected;
}

export function provideLiquidity(
    amountA: number,           // Contract input
    addedAExpected: number,    // Expected return value
    addedBExpected: number,    // Expected return value
    mintedLpExpected: number,  // Expected return value
    sender: any,               // Transaction sender
    disp: boolean = false      // Optional with default false
    ){
    const test = simnet.callPublicFn(
        "exchange",
        "provide-liquidity",
        [Cl.uint(amountA)],
        sender
    );

    if (amountA <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) {
            console.log(`☑️ Zero amount A: Expected ERR_ZERO_AMOUNT (700) - provide-liquidity result:`, test.result);
        }
        return 0;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Provide liquidity failed with error: ${errorCode}`);
            if (errorCode === 704) {
                console.log(`   This typically means exchange not initialized or no available liquidity`);
            }
            if (errorCode === 700) {
                console.log(`   This typically means calculated amount-b resulted in zero`);
            }
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "added-a": Cl.uint(addedAExpected),
                "added-b": Cl.uint(addedBExpected),
                "minted-lp": Cl.uint(mintedLpExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Provide liquidity successful: ${amountA} WELSH + ${addedBExpected} STREET → ${mintedLpExpected} LP`);
        console.log("provide-liquidity result:");

        const resultValue = (test.result as any).value.value;
        console.log(`  added-a: ${Number(resultValue['added-a'].value)}`);
        console.log(`  added-b: ${Number(resultValue['added-b'].value)}`);
        console.log(`  minted-lp: ${Number(resultValue['minted-lp'].value)}`);
    }

    return mintedLpExpected;
}

export function removeLiquidity(
    amountLp: number,
    burnedLpExpected: number,
    taxAExpected: number,
    taxBExpected: number,
    userAExpected: number,
    userBExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "exchange",
        "remove-liquidity",
        [Cl.uint(amountLp)],
        sender
    );
    if (amountLp <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) console.log(`☑️ ERR_ZERO_AMOUNT: Cannot remove zero LP tokens`);
        return 0;
    }
    if (test.result.type === 'err') {
        const errorCode = (test.result as any).value.value;
        if (disp) console.log(`☑️ Remove liquidity error: ${errorCode}`);
        expect(test.result.type).toEqual('err');
        return 0;
    }
    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "burned-lp": Cl.uint(burnedLpExpected),
                "tax-a": Cl.uint(taxAExpected),
                "tax-b": Cl.uint(taxBExpected),
                "user-a": Cl.uint(userAExpected),
                "user-b": Cl.uint(userBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Remove liquidity successful: ${amountLp} LP → ${userAExpected} WELSH + ${userBExpected} STREET (tax: ${taxAExpected} WELSH + ${taxBExpected} STREET)`);
        const result = (test.result as any).value.value;
        console.log(`remove-liquidity result:`);
        console.log(`  burned-lp: ${result['burned-lp'].value}`);
        console.log(`  tax-a: ${result['tax-a'].value}`);
        console.log(`  tax-b: ${result['tax-b'].value}`);
        console.log(`  user-a: ${result['user-a'].value}`);
        console.log(`  user-b: ${result['user-b'].value}`);
    }

    return burnedLpExpected;
}

export function swapAB(
    amountA: number,
    amountInExpected: number,
    amountOutExpected: number,
    feeAExpected: number,
    resAExpected: number,
    resANewExpected: number,
    resBExpected: number,
    resBNewExpected: number,
    revAExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "exchange",
        "swap-a-b",
        [Cl.uint(amountA)],
        sender
    );

    if (amountA <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) {
            console.log(`☑️ Zero amount A: Expected ERR_ZERO_AMOUNT (700) - swap-a-b result:`, test.result);
        }
        return 0;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Swap A-B failed with error: ${errorCode}`);
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-in": Cl.uint(amountInExpected),
                "amount-out": Cl.uint(amountOutExpected),
                "fee-a": Cl.uint(feeAExpected),
                "res-a": Cl.uint(resAExpected),
                "res-a-new": Cl.uint(resANewExpected),
                "res-b": Cl.uint(resBExpected),
                "res-b-new": Cl.uint(resBNewExpected),
                "rev-a": Cl.uint(revAExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Swap A-B successful: ${amountA} WELSH → ${amountOutExpected} STREET`);
        console.log(`  Fee A: ${feeAExpected}, Revenue A: ${revAExpected}`);
        console.log(`  Reserves: A ${resAExpected} → ${resANewExpected}, B ${resBExpected} → ${resBNewExpected}`);
    }

    return amountOutExpected;
}

export function swapBA(
    amountB: number,
    amountInExpected: number,
    amountOutExpected: number,
    feeBExpected: number,
    resAExpected: number,
    resANewExpected: number,
    resBExpected: number,
    resBNewExpected: number,
    revBExpected: number,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callPublicFn(
        "exchange",
        "swap-b-a",
        [Cl.uint(amountB)],
        sender
    );

    if (amountB <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(700)));
        if (disp) {
            console.log(`☑️ Zero amount B: Expected ERR_ZERO_AMOUNT (700) - swap-b-a result:`, test.result);
        }
        return 0;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Swap B-A failed with error: ${errorCode}`);
        }
        return 0;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount-in": Cl.uint(amountInExpected),
                "amount-out": Cl.uint(amountOutExpected),
                "fee-b": Cl.uint(feeBExpected),
                "res-a": Cl.uint(resAExpected),
                "res-a-new": Cl.uint(resANewExpected),
                "res-b": Cl.uint(resBExpected),
                "res-b-new": Cl.uint(resBNewExpected),
                "rev-b": Cl.uint(revBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Swap B-A successful: ${amountB} STREET → ${amountOutExpected} WELSH`);
        console.log(`  Fee B: ${feeBExpected}, Revenue B: ${revBExpected}`);
        console.log(`  Reserves: A ${resAExpected} → ${resANewExpected}, B ${resBExpected} → ${resBNewExpected}`);
    }
    return amountOutExpected;
}

export function setExchangeFee(
    amount: number,
    sender: string,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== setExchangeFee ===`);
        console.log(`Sender: ${sender}`);
        console.log(`Fee Amount: ${amount}`);
    }
    const result = simnet.callPublicFn(
        'exchange',
        'set-exchange-fee',
        [Cl.uint(amount)],
        sender
    );
    if (disp) {
        console.log(`Result type: ${result.result.type}`);
    }
    if (result.result.type === 'err') {
        const errorValue = Number((result.result as any).value.value);
        if (disp) {
            console.log(`☑️ Exchange fee change failed with error: ${errorValue}`);
        }
        expect(result.result).toEqual(Cl.error(Cl.uint(errorValue)));
        return result;
    }
    expect(result.result).toEqual(Cl.ok(Cl.tuple({
        "fee": Cl.uint(amount)
    })));
    if (disp) {
        console.log('✅ Exchange fee set successfully');
    }
    return result;
}

export function setExchangeRev(
    amount: number,
    sender: string,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== setExchangeRev ===`);
        console.log(`Sender: ${sender}`);
        console.log(`Rev Amount: ${amount}`);
    }
    const result = simnet.callPublicFn(
        'exchange',
        'set-exchange-rev',
        [Cl.uint(amount)],
        sender
    );
    if (disp) {
        console.log(`Result type: ${result.result.type}`);
    }
    if (result.result.type === 'err') {
        const errorValue = Number((result.result as any).value.value);
        if (disp) {
            console.log(`☑️ Exchange rev change failed with error: ${errorValue}`);
        }
        expect(result.result).toEqual(Cl.error(Cl.uint(errorValue)));
        return result;
    }
    expect(result.result).toEqual(Cl.ok(Cl.tuple({
        "rev": Cl.uint(amount)
    })));
    if (disp) {
        console.log('✅ Exchange rev set successfully');
    }
    return result;
}

export function setExchangeTax(
    amount: number,
    sender: string,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== setExchangeTax ===`);
        console.log(`Sender: ${sender}`);
        console.log(`Tax Amount: ${amount}`);
    }
    const result = simnet.callPublicFn(
        'exchange',
        'set-exchange-tax',
        [Cl.uint(amount)],
        sender
    );
    if (disp) {
        console.log(`Result type: ${result.result.type}`);
    }
    if (result.result.type === 'err') {
        const errorValue = Number((result.result as any).value.value);
        if (disp) {
            console.log(`☑️ Exchange tax change failed with error: ${errorValue}`);
        }
        expect(result.result).toEqual(Cl.error(Cl.uint(errorValue)));
        return result;
    }
    expect(result.result).toEqual(Cl.ok(Cl.tuple({
        "tax": Cl.uint(amount)
    })));
    if (disp) {
        console.log('✅ Exchange tax set successfully');
    }
    return result;
}

export function setTreasuryAddress(
    newTreasury: string,
    sender: string,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== setTreasuryAddress ===`);
        console.log(`Sender: ${sender}`);
        console.log(`New Treasury: ${newTreasury}`);
    }
    const result = simnet.callPublicFn(
        'exchange',
        'set-treasury-address',
        [Cl.principal(newTreasury)],
        sender
    );
    if (disp) {
        console.log(`Result type: ${result.result.type}`);
    }
    if (result.result.type === 'err') {
        const errorValue = Number((result.result as any).value.value);
        if (disp) {
            console.log(`☑️ Treasury address change failed with error: ${errorValue}`);
        }
        expect(result.result).toEqual(Cl.error(Cl.uint(errorValue)));
        return result;
    }
    expect(result.result).toEqual(Cl.ok(Cl.principal(newTreasury)));
    if (disp) {
        console.log('✅ Treasury address set successfully');
    }
    return result;
}

export function setTreasuryLocked(
    sender: string,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== setTreasuryLocked ===`);
        console.log(`Sender: ${sender}`);
    }
    const result = simnet.callPublicFn(
        'exchange',
        'set-treasury-locked',
        [],
        sender
    );
    if (disp) {
        console.log(`Result type: ${result.result.type}`);
    }
    if (result.result.type === 'err') {
        const errorValue = Number((result.result as any).value.value);
        if (disp) {
            console.log(`☑️ Treasury locked change failed with error: ${errorValue}`);
        }
        expect(result.result).toEqual(Cl.error(Cl.uint(errorValue)));
        return result;
    }
    expect(result.result).toEqual(Cl.ok(Cl.bool(true)));
    if (disp) {
        console.log('✅ Treasury locked successfully');
    }
    return result;
}

export function getBlocks(
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "exchange",
        "get-blocks",
        [],
        sender
    );
    expect(test.result.type).toEqual('ok');
    const result = (test.result as any).value.value;
    const stacksBlock = Number(result['stacks-block'].value);
    const bitcoinBlock = Number(result['bitcoin-block'].value);

    if (disp) {
        console.log(`✅ getBlocks Pass: Stacks Block ${stacksBlock}, Bitcoin Block ${bitcoinBlock}`);
    }

    return {
        stacksBlock,
        bitcoinBlock
    };
}

export function getExchangeInfo(
    availAExpected: number,
    availBExpected: number,
    feeExpected: number,
    lockedAExpected: number,
    lockedBExpected: number,
    reserveAExpected: number,
    reserveBExpected: number,
    revenueExpected: number,
    taxExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn("exchange", "get-exchange-info", [], sender);
    const info = (test.result as any).value.value;
    const receivedAvailA = Number(info['avail-a'].value);
    const receivedAvailB = Number(info['avail-b'].value);
    const receivedFee = Number(info['fee'].value);
    const receivedLockedA = Number(info['locked-a'].value);
    const receivedLockedB = Number(info['locked-b'].value);
    const receivedReserveA = Number(info['reserve-a'].value);
    const receivedReserveB = Number(info['reserve-b'].value);
    const receivedRevenue = Number(info['revenue'].value);
    const receivedTax = Number(info['tax'].value);

    // Validate all expected values
    expect(receivedAvailA).toEqual(availAExpected);
    expect(receivedAvailB).toEqual(availBExpected);
    expect(receivedFee).toEqual(feeExpected);
    expect(receivedLockedA).toEqual(lockedAExpected);
    expect(receivedLockedB).toEqual(lockedBExpected);
    expect(receivedReserveA).toEqual(reserveAExpected);
    expect(receivedReserveB).toEqual(reserveBExpected);
    expect(receivedRevenue).toEqual(revenueExpected);
    expect(receivedTax).toEqual(taxExpected);

    const allMatch = (
        receivedAvailA === availAExpected &&
        receivedAvailB === availBExpected &&
        receivedFee === feeExpected &&
        receivedLockedA === lockedAExpected &&
        receivedLockedB === lockedBExpected &&
        receivedReserveA === reserveAExpected &&
        receivedReserveB === reserveBExpected &&
        receivedRevenue === revenueExpected &&
        receivedTax === taxExpected
    );

    if (disp) {
        if (allMatch) {
            console.log(`✅ getExchangeInfo Pass: All values match expected`);
        } else {
            console.log(`☑️ getExchangeInfo Fail: Values mismatch`);
        }
        // Display all values line-by-line for clarity
        console.log(`Exchange Info:`);
        console.log(`  avail-a: ${receivedAvailA}`);
        console.log(`  avail-b: ${receivedAvailB}`);
        console.log(`  fee: ${receivedFee}`);
        console.log(`  locked-a: ${receivedLockedA}`);
        console.log(`  locked-b: ${receivedLockedB}`);
        console.log(`  reserve-a: ${receivedReserveA}`);
        console.log(`  reserve-b: ${receivedReserveB}`);
        console.log(`  revenue: ${receivedRevenue}`);
        console.log(`  tax: ${receivedTax}`);
    }

    return {
        availA: receivedAvailA,
        availB: receivedAvailB,
        fee: receivedFee,
        lockedA: receivedLockedA,
        lockedB: receivedLockedB,
        reserveA: receivedReserveA,
        reserveB: receivedReserveB,
        revenue: receivedRevenue,
        tax: receivedTax
    };
}

export function getTreasuryAddress(
    treasuryAddressExpected: string,
    contract: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        contract,
        "get-treasury-address",
        [],
        sender
    );
    const received = (test.result as any).value.value;
    expect(received).toEqual(treasuryAddressExpected);
    if (received === treasuryAddressExpected) {
        if (disp) {
            console.log(`✅ getTreasuryAddress Pass: Expected ${treasuryAddressExpected}, Received ${received}`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getTreasuryAddress Fail: Expected ${treasuryAddressExpected}, Received ${received}`);
        }
    }
    return received;
}

export function getTreasuryLocked(
    treasuryLockedExpected: boolean,
    contract: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        contract,
        "get-treasury-locked",
        [],
        sender
    );
    expect(test.result).toEqual(Cl.ok(Cl.bool(treasuryLockedExpected)));
    if (disp) {
        console.log(`✅ getTreasuryLocked Pass: Expected ${treasuryLockedExpected}`);
        console.log("getTreasuryLocked result:", test.result);
    }
    return test.result;
}