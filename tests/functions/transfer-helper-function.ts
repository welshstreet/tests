import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

export function transfer(
    amount: number,
    contract: string,
    sender: any,
    recipient: string | { address: string; contractName: string },
    disp: boolean = false
    ){
    let principalArg;
    let displayName;
    if (typeof recipient === 'string') {
        // Standard principal address
        principalArg = Cl.principal(recipient);
        displayName = recipient;
    } else {
        principalArg = Cl.contractPrincipal(recipient.address, recipient.contractName);
        displayName = `${recipient.address}.${recipient.contractName}`;
    }
    const test = simnet.callPublicFn(
        contract,
        "transfer",
        [
            Cl.uint(amount),
            Cl.principal(sender),
            principalArg,
            Cl.none()
        ],
        sender
    );

    // Check zero amount (ERR_ZERO_AMOUNT - varies by contract)
    if (amount <= 0) {
        let expectedErrorCode = 600; // default for credit
        if (contract === 'street') {
            expectedErrorCode = 900;
        } else if (contract === 'welshcorgicoin') {
            expectedErrorCode = 2; // ERR-YOU-POOR
        }
        
        expect(test.result).toEqual(Cl.error(Cl.uint(expectedErrorCode)));
        if (disp) {
            console.log(`☑️ Zero amount: Expected error ${expectedErrorCode} for ${contract} transfer`);
        }
        return false;
    }

    // Check token ownership (ERR_NOT_TOKEN_OWNER - varies by contract)
    if (sender !== deployer && sender !== wallet1) {
        let expectedErrorCode = 602; // default for credit (ERR_NOT_TOKEN_OWNER)
        if (contract === 'street') {
            expectedErrorCode = 903; // ERR_NOT_TOKEN_OWNER
        } else if (contract === 'welshcorgicoin') {
            expectedErrorCode = 1; // ERR-UNAUTHORIZED
        }
        
        expect(test.result).toEqual(Cl.error(Cl.uint(expectedErrorCode)));
        if (disp) {
            console.log(`☑️ Not token owner: Expected error ${expectedErrorCode} for ${contract} transfer`);
        }
        return false;
    }

    // Check for other errors (insufficient balance, etc.)
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        
        if (disp) {
            console.log(`☑️ ${contract} transfer failed with error: ${errorCode}`);
        }
        return false;
    }

    // Success case
    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));

    if (disp && test.result.type === 'ok') {
        console.log(`✅ ${contract} transfer successful: ${amount} from ${sender} to ${recipient}`);
    }

    return true;
}
