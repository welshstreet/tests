import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function transformer(
    tokenContract: string,
    amount: number,
    recipient: string,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callPublicFn(
        "exchange",
        "transformer",
        [
            Cl.contractPrincipal(deployer, tokenContract),
            Cl.uint(amount),
            Cl.principal(recipient)
        ],
        sender
    );
    if (amount <= 0) {
        expect(test.result).toEqual(Cl.error(Cl.uint(600)));
        if (disp) {
            console.log(`☑️ Zero amount: Expected error for transformer`);
        }
        return false;
    }
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Transformer failed with error: ${errorCode}`);
        }
        return false;
    }
    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Transformer successful: ${amount} ${tokenContract} to ${recipient}`);
    }
    return true;
}
