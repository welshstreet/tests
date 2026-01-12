import { describe, it } from 'vitest';
import { transformer } from './functions/transformer-helper-function';
import { setupInitialLiquidity } from './functions/setup-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('=== TRANSFORMER TESTS ===', () => {
    it('=== TRANSFORMER PASS ===', () => {
        setupInitialLiquidity(disp);
        const transferAmount = 100;
        transformer('street', transferAmount, wallet1, deployer, disp);
    });

    it('=== TRANSFORMER ERR_NOT_AUTHORIZED ===', () => {
        setupInitialLiquidity(disp);
        const transferAmount = 100;
        transformer('welshcorgicoin', transferAmount, wallet1, wallet1);
    });
});