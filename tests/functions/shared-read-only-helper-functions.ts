import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

export function getBalance(
    balanceExpected: number,
    token: string,
    who: string | { address: string; contractName: string },
    sender: any,
    disp: boolean = false
    ){
    let principalArg;
    let displayName;
    if (typeof who === 'string') {
        // Standard principal address
        principalArg = Cl.principal(who);
        displayName = who;
    } else {
        principalArg = Cl.contractPrincipal(who.address, who.contractName);
        displayName = `${who.address}.${who.contractName}`;
    }
    const test = simnet.callReadOnlyFn(
        token,
        "get-balance",
        [principalArg],
        sender
    );
    const received = Number((test.result as any).value.value);
    expect(received).toEqual(balanceExpected);
    if (received === balanceExpected) {
        if (disp) {
            console.log(`✅ getBalance Pass: ${displayName} - ${token} - Expected ${balanceExpected}, Received ${received}`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getBalance Fail: ${displayName} - ${token} - Expected ${balanceExpected}, Received ${received}`);
        }
    }
    return received;
}

export function getContractOwner(
    contractOwnerExpected: string,
    token: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        token,
        "get-contract-owner",
        [],
        sender
    );
    const received = (test.result as any).value.value;
    expect(received).toEqual(contractOwnerExpected);
    if (received === contractOwnerExpected) {
        if (disp) {
            console.log(`✅ getContractOwner Pass: ${token} - Expected ${contractOwnerExpected}, Received ${received}`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getContractOwner Fail: ${token} - Expected ${contractOwnerExpected}, Received ${received}`);
        }
    }
    return received;
}

export function getDecimals(
    decimalsExpected: number,
    token: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        token,
        "get-decimals",
        [],
        sender
    );
    const received = Number((test.result as any).value.value);
    expect(received).toEqual(decimalsExpected);
    if (received === decimalsExpected) {
        if (disp) {
            console.log(`✅ getDecimals Pass: ${token} - Expected ${decimalsExpected}, Received ${received}`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getDecimals Fail: ${token} - Expected ${decimalsExpected}, Received ${received}`);
        }
    }
    return received;
}

export function getName(
    nameExpected: string,
    token: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        token,
        "get-name",
        [],
        sender
    );
    const received = (test.result as any).value.value;
    expect(received).toEqual(nameExpected);
    if (received === nameExpected) {
        if (disp) {
            console.log(`✅ getName Pass: ${token} - Expected "${nameExpected}", Received "${received}"`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getName Fail: ${token} - Expected "${nameExpected}", Received "${received}"`);
        }
    }
    return received;
}

export function getSymbol(
    symbolExpected: string,
    token: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        token,
        "get-symbol",
        [],
        sender
    );
    const received = (test.result as any).value.value;
    expect(received).toEqual(symbolExpected);
    if (received === symbolExpected) {
        if (disp) {
            console.log(`✅ getSymbol Pass: ${token} - Expected "${symbolExpected}", Received "${received}"`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getSymbol Fail: ${token} - Expected "${symbolExpected}", Received "${received}"`);
        }
    }
    return received;
}

export function getTokenUri(
    tokenUriExpected: string | null,
    token: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        token,
        "get-token-uri",
        [],
        sender
    );
    let received;
    if ((test.result as any).value.type === 'none') {
        received = null;
    } else {
        received = (test.result as any).value.value.value;
    }
    expect(received).toEqual(tokenUriExpected);
    if (received === tokenUriExpected) {
        if (disp) {
            console.log(`✅ getTokenUri Pass: ${token} - Expected "${tokenUriExpected}", Received "${received}"`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getTokenUri Fail: ${token} - Expected "${tokenUriExpected}", Received "${received}"`);
        }
    }
    return received;
}

export function getTotalSupply(
    totalSupplyExpected: number,
    token: string,
    sender: any,
    disp: boolean = false
    ){
    const test = simnet.callReadOnlyFn(
        token,
        "get-total-supply",
        [],
        sender
    );
    const received = Number((test.result as any).value.value);
    expect(received).toEqual(totalSupplyExpected);
    if (received === totalSupplyExpected) {
        if (disp) {
            console.log(`✅ getTotalSupply Pass: Expected ${totalSupplyExpected}, Received ${received}`);
        }
    } else {
        if (disp) {
            console.log(`☑️ getTotalSupply Fail: Expected ${totalSupplyExpected}, Received ${received}`);
        }
    }
    return received;
}