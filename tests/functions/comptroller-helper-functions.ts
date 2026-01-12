import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function transferCredit(
    amount: number,
    sender: string,
    recipient: string,
    caller: any,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== transferCredit: ${amount} from ${sender} to ${recipient} ===`);
        console.log(`Caller: ${caller}`);
    }
    
    const test = simnet.callPublicFn(
        "comptroller",
        "transfer-credit",
        [
            Cl.uint(amount),
            Cl.principal(sender),
            Cl.principal(recipient)
        ],
        caller
    );
    
    if (disp) {
        console.log(`Result type: ${test.result.type}`);
    }
    
    // Check zero amount (ERR_ZERO_AMOUNT - 900)
    if (amount <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(900)));
        if (disp) {
            console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (900)`);
        }
        return false;
    }
    
    // Check token ownership (ERR_NOT_TOKEN_OWNER - 901)
    if (caller !== sender) {
        expect(test.result).toEqual(Cl.error(Cl.uint(901)));
        if (disp) {
            console.log(`☑️ Not token owner: Expected ERR_NOT_TOKEN_OWNER (901)`);
        }
        return false;
    }
    
    // Check for other errors (insufficient balance, etc.)
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        
        if (disp) {
            console.log(`☑️ Transfer failed with error: ${errorCode}`);
        }
        return false;
    }
    
    // Success case - expect (ok true)
    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
    
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Credit transfer successful: ${amount} from ${sender} to ${recipient}`);
    }
    
    return true;
}