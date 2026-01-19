import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function transferCredit(
    amount: number,
    sender: string,
    recipient: string,
    caller: any,
    memo?: Uint8Array,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== transferCredit: ${amount} from ${sender} to ${recipient} ===`);
        console.log(`Caller: ${caller}`);
        if (memo) {
            console.log(`Memo: ${new TextDecoder().decode(memo)}`);
        }
    }
    
    const memoArg = memo ? Cl.some(Cl.bufferFromUtf8(new TextDecoder().decode(memo))) : Cl.none();
    
    const test = simnet.callPublicFn(
        "controller",
        "transfer",
        [
            Cl.uint(amount),
            Cl.principal(sender),
            Cl.principal(recipient),
            memoArg
        ],
        caller
    );
    
    if (disp) {
        console.log(`Result type: ${test.result.type}`);
    }
    
    // Check zero amount (ERR_ZERO_AMOUNT - u500)
    if (amount <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(500)));
        if (disp) {
            console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (500)`);
        }
        return false;
    }
    
    // Check token ownership (ERR_NOT_TOKEN_OWNER - u502)
    if (caller !== sender) {
        expect(test.result).toEqual(Cl.error(Cl.uint(502)));
        if (disp) {
            console.log(`☑️ Not token owner: Expected ERR_NOT_TOKEN_OWNER (502)`);
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
    
    // Success case - expect (ok { amount-lp: amount })
    expect(test.result).toEqual(Cl.ok(Cl.tuple({
        'amount-lp': Cl.uint(amount)
    })));
    
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Credit transfer successful: ${amount} from ${sender} to ${recipient}`);
    }
    
    return true;
}