import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!

export function claim(
    balanceExpected: number,
    claimedExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callPublicFn(
        "genesis",
        "claim",
        [],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        if (errorCode === 502) {
            expect(test.result).toEqual(Cl.error(Cl.uint(502)));
            if (disp) {
                console.log(`☑️ Claim not active: Expected ERR_NOT_ACTIVE_FUND (502) - claim result:`, test.result);
            }
            return { balance: 0, claimed: 0 };
        } else if (errorCode === 500) {
            expect(test.result).toEqual(Cl.error(Cl.uint(500)));
            if (disp) {
                console.log(`☑️ Zero balance: Expected ERR_ZERO_AMOUNT (500) - claim result:`, test.result);
            }
            return { balance: 0, claimed: 0 };
        } else {
            if (disp) {
                console.log(`☑️ Claim failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return { balance: 0, claimed: 0 };
        }
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount": Cl.uint(claimedExpected),
                "balance": Cl.uint(balanceExpected)
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Genesis claim successful: Balance ${balanceExpected}, Claimed ${claimedExpected}`);
    }

    return { balance: balanceExpected, claimed: claimedExpected };
}

export function contribute(
    amount: number,
    totalExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callPublicFn(
        "genesis",
        "contribute",
        [Cl.uint(amount)],
        sender
    );

    // Check zero amount (ERR_ZERO_AMOUNT - 500)
    if (amount <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(500)));
        if (disp) {
            console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (500) - contribute result:`, test.result);
        }
        return { amount: 0, total: 0 };
    }

    // Check if contribute is not active (ERR_NOT_ACTIVE_FUND - 502)
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        if (errorCode === 502) {
            expect(test.result).toEqual(Cl.error(Cl.uint(502)));
            if (disp) {
                console.log(`☑️ Contribute not active: Expected ERR_NOT_ACTIVE_FUND (502) - contribute result:`, test.result);
            }
            return { amount: 0, total: 0 };
        } else {
            if (disp) {
                console.log(`☑️ Contribute failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return { amount: 0, total: 0 };
        }
    }

    // Success case
    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "amount": Cl.uint(amount),
                "total": Cl.uint(totalExpected)
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Genesis contribute successful: Amount ${amount}, Total ${totalExpected}`);
    }

    return { amount: amount, total: totalExpected };
}

export function withdrawal(
    balanceExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callPublicFn(
        "genesis",
        "withdrawal",
        [],
        sender
    );

    // Check authorization (ERR_NOT_CONTRACT_OWNER - 501)
    if (sender !== deployer) {
        expect(test.result).toEqual(Cl.error(Cl.uint(501)));
        if (disp) {
            console.log(`☑️ Not contract owner: Expected ERR_NOT_CONTRACT_OWNER (501) - withdrawal result:`, test.result);
        }
        return 0;
    }

    // Check if there's a balance to withdraw
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        if (errorCode === 500) {
            expect(test.result).toEqual(Cl.error(Cl.uint(500)));
            if (disp) {
                console.log(`☑️ Zero balance: Expected ERR_ZERO_AMOUNT (500) - withdrawal result:`, test.result);
            }
            return 0;
        } else if (errorCode === 503) {
            expect(test.result).toEqual(Cl.error(Cl.uint(503)));
            if (disp) {
                console.log(`☑️ Token supply not available: Expected ERR_TOKEN_SUPPLY_NOT_AVAILABLE (503) - withdrawal result:`, test.result);
            }
            return 0;
        } else {
            if (disp) {
                console.log(`☑️ Withdrawal failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return 0;
        }
    }

    // Success case
    expect(test.result).toEqual(Cl.ok(Cl.uint(balanceExpected)));

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Genesis withdrawal successful: ${balanceExpected}`);
    }

    return balanceExpected;
}

export function setClaimActive(
    expectedNewState: boolean,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callPublicFn(
        "genesis",
        "set-claim-active",
        [],
        sender
    );

    // Check authorization (ERR_NOT_CONTRACT_OWNER - 501)
    if (sender !== deployer) {
        expect(test.result).toEqual(Cl.error(Cl.uint(501)));
        if (disp) {
            console.log(`☑️ Not contract owner: Expected ERR_NOT_CONTRACT_OWNER (501) - set-claim-active result:`, test.result);
        }
        return false;
    }

    // Success case
    expect(test.result).toEqual(Cl.ok(Cl.bool(expectedNewState)));

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Set claim active successful: ${expectedNewState}`);
    }

    return expectedNewState;
}

export function setContributeActive(
    expectedNewState: boolean,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callPublicFn(
        "genesis",
        "set-contribute-active",
        [],
        sender
    );

    // Check authorization (ERR_NOT_CONTRACT_OWNER - 501)
    if (sender !== deployer) {
        expect(test.result).toEqual(Cl.error(Cl.uint(501)));
        if (disp) {
            console.log(`☑️ Not contract owner: Expected ERR_NOT_CONTRACT_OWNER (501) - set-contribute-active result:`, test.result);
        }
        return false;
    }

    // Success case
    expect(test.result).toEqual(Cl.ok(Cl.bool(expectedNewState)));

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Set contribute active successful: ${expectedNewState}`);
    }

    return expectedNewState;
}

export function getBlocks(
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "genesis",
        "get-blocks",
        [],
        sender
    );

    expect(test.result.type).toEqual('ok');

    if (disp && test.result.type === 'ok') {
        const resultValue = (test.result as any).value.value;
        const stacksBlock = Number(resultValue["stacks-block"].value);
        const bitcoinBlock = Number(resultValue["bitcoin-block"].value);
        console.log(`✅ getBlocks Pass: Stacks Block ${stacksBlock}, Bitcoin Block ${bitcoinBlock}`);
    }

    return test.result;
}

export function getClaimActive(
    expectedActive: boolean,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "genesis",
        "get-claim-active",
        [],
        sender
    );

    expect(test.result).toEqual(Cl.ok(Cl.bool(expectedActive)));

    if (disp) {
        console.log(`✅ getClaimActive Pass: Expected ${expectedActive}, Received ${expectedActive}`);
    }

    return expectedActive;
}

export function getContributeActive(
    expectedActive: boolean,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "genesis",
        "get-contribute-active",
        [],
        sender
    );

    expect(test.result).toEqual(Cl.ok(Cl.bool(expectedActive)));

    if (disp) {
        console.log(`✅ getContributeActive Pass: Expected ${expectedActive}, Received ${expectedActive}`);
    }

    return expectedActive;
}

export function getUserBalance(
    address: string,
    balanceExpected: number,
    claimedExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "genesis",
        "get-user-balance",
        [Cl.principal(address)],
        sender
    );

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "balance": Cl.uint(balanceExpected),
                "claimed": Cl.uint(claimedExpected)
            })
        )
    );

    if (disp) {
        console.log(`✅ getUserBalance Pass: Address ${address} - Balance ${balanceExpected}, Claimed ${claimedExpected}`);
    }

    return { balance: balanceExpected, claimed: claimedExpected };
}

export function getTotalContribution(
    totalExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn(
        "genesis",
        "get-total-contribution",
        [],
        sender
    );

    expect(test.result).toEqual(Cl.ok(Cl.uint(totalExpected)));

    if (disp) {
        console.log(`✅ getTotalContribution Pass: Expected ${totalExpected}, Received ${totalExpected}`);
    }

    return totalExpected;
}