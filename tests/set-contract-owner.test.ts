import { describe, it } from 'vitest';
import { setContractOwner } from './functions/set-contract-owner-helper-functions';
import { getContractOwner } from './functions/shared-read-only-helper-functions';
import { disp } from './vitestconfig'

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== SET CONTRACT OWNER TESTS ===', () => {
    it('=== SET CREDIT CONTRACT OWNER ===', () => {
        getContractOwner(deployer, 'credit', deployer, disp);
        setContractOwner('credit', wallet1, deployer, disp);
        getContractOwner(wallet1, 'credit', wallet1);
        });

        it('=== SET EXCHANGE CONTRACT OWNER ===', () => {
        getContractOwner(deployer, 'exchange', deployer, disp);
        setContractOwner('exchange', wallet1, deployer, disp);
        getContractOwner(wallet1, 'exchange', wallet1);
        });

        it('=== SET REWARDS CONTRACT OWNER ===', () => {
        getContractOwner(deployer, 'rewards', deployer, disp);
        setContractOwner('rewards', wallet1, deployer, disp);
        getContractOwner(wallet1, 'rewards', wallet1);
        });

        it('=== SET STREET CONTRACT OWNER ===', () => {
        getContractOwner(deployer, 'street', deployer, disp);
        setContractOwner('street', wallet1, deployer, disp);
        getContractOwner(wallet1, 'street', wallet1);
        });

        it('=== UNAUTHORIZED CREDIT CONTRACT OWNER CHANGE ===', () => {
        getContractOwner(deployer, 'credit', deployer, disp);
        setContractOwner('credit', wallet1, wallet2);
        getContractOwner(deployer, 'credit', deployer, disp);
        });

        it('=== UNAUTHORIZED MULTI-CONTRACT OWNER CHANGES ===', () => {
        const allContracts = ['credit', 'exchange', 'rewards', 'street'] as const;
        allContracts.forEach(contract => {
            getContractOwner(deployer, contract, deployer, disp);
            setContractOwner(contract, wallet1, wallet2);
            getContractOwner(deployer, contract, deployer, disp);
        });
        });
        it('=== ERR_INVALID_PRINCIPAL ===', () => {
            // Try to set exchange contract owner to the same principal (deployer)
            getContractOwner(deployer, 'exchange', deployer, disp);
            setContractOwner('exchange', deployer, deployer, disp);
            getContractOwner(deployer, 'exchange', deployer, disp);
        })

});

