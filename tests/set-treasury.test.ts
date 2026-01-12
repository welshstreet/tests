import { describe, it } from 'vitest';
import { getTreasuryAddress, getTreasuryLocked, setTreasuryAddress, setTreasuryLocked } from './functions/exchange-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== SET TREASURY TESTS ===', () => {
    it('=== SET TREASURY ADDRESS PASS ===', () => {
        getTreasuryAddress(deployer, 'exchange', deployer, disp);
        setTreasuryAddress(wallet1, deployer, disp);
        getTreasuryAddress(wallet1, 'exchange', wallet1, disp);
    });

    it('=== SET TREASURY LOCKED PASS ===', () => {
        getTreasuryLocked(false, 'exchange', deployer, disp);
        setTreasuryLocked(deployer, disp);
        getTreasuryLocked(true, 'exchange', deployer, disp);
    });

    it('=== ERR_NOT_TREASURY - SET TREASURY ADDRESS ===', () => {
        getTreasuryAddress(deployer, 'exchange', deployer, disp);
        setTreasuryAddress(wallet2, wallet1, disp);
        getTreasuryAddress(deployer, 'exchange', deployer, disp);
    });

    it('=== ERR_LOCKED_TREASURY - SET TREASURY ADDRESS ===', () => {
        getTreasuryLocked(false, 'exchange', deployer, disp);
        setTreasuryLocked(deployer, disp);
        getTreasuryLocked(true, 'exchange', deployer, disp);
        getTreasuryAddress(deployer, 'exchange', deployer, disp);
        setTreasuryAddress(wallet1, deployer, disp);
        getTreasuryAddress(deployer, 'exchange', deployer, disp);
    });

    it('=== ERR_NOT_TREASURY - SET TREASURY LOCKED ===', () => {
        getTreasuryLocked(false, 'exchange', deployer, disp);
        setTreasuryLocked(wallet1, disp);
        getTreasuryLocked(false, 'exchange', deployer, disp);
    });

    it('=== ERR_LOCKED_TREASURY - SET TREASURY LOCKED ===', () => {
        getTreasuryLocked(false, 'exchange', deployer, disp);
        setTreasuryLocked(deployer, disp);
        getTreasuryLocked(true, 'exchange', deployer, disp);
        setTreasuryLocked(deployer, disp);
        getTreasuryLocked(true, 'exchange', deployer, disp);
    });
});
