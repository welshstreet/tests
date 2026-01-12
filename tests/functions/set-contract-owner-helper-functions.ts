import { Cl } from '@stacks/transactions';
import { expect } from 'vitest';

export type ContractName = 'credit' | 'exchange' | 'rewards' | 'street';

export function setContractOwner(
    contract: ContractName,
    newOwner: string,
    sender: string,
    disp: boolean = false
    ) {
    if (disp) {
        console.log(`\n=== setContractOwner: ${contract} ===`);
        console.log(`Sender: ${sender}`);
        console.log(`New Owner: ${newOwner}`);
    }
    const result = simnet.callPublicFn(
        contract,
        'set-contract-owner',
        [Cl.principal(newOwner)],
        sender
    );
    if (disp) {
        console.log(`Result type: ${result.result.type}`);
    }
    if (result.result.type === 'err') {
        const errorValue = Number((result.result as any).value.value);
        if (disp) {
            console.log(`☑️ Contract owner change failed with error: ${errorValue}`);
        }
        expect(result.result).toEqual(Cl.error(Cl.uint(errorValue)));
        return result;
    }
    expect(result.result).toEqual(Cl.ok(Cl.bool(true)));
    if (disp) {
        console.log('✅ Contract owner set successfully');
    }
    return result;
}
