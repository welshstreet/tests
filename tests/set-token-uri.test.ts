import { describe, it } from 'vitest';
import { setTokenUri } from './functions/set-token-uri-helper-functions';
import { getTokenUri } from './functions/shared-read-only-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== SET TOKEN URI TESTS ===', () => {
    it('=== CREDIT SET TOKEN URI PASS ===', () => {
        const initialCreditUri = "https://gateway.lighthouse.storage/ipfs/bafkreia3r5yfzb3r4ixfzw35s76ktvjuf6v4zhug76ck2bgd5ypyx2faea";
        getTokenUri(initialCreditUri, 'credit', deployer, disp);

        const newCreditUri = "https://new-credit-uri.example.com";
        setTokenUri('credit', newCreditUri, deployer, disp);
        getTokenUri(newCreditUri, 'credit', deployer, disp);
    });

    it('=== STREET SET TOKEN URI PASS ===', () => {
        const initialStreetUri = "https://gateway.lighthouse.storage/ipfs/bafkreihore32ofrwm27vbeunjv5dgjdoexzpvbqu4rwt6dspn6aji4fmgy";
        getTokenUri(initialStreetUri, 'street', deployer, disp);

        const newStreetUri = "https://new-street-uri.example.com";
        setTokenUri('street', newStreetUri, deployer, disp);
        getTokenUri(newStreetUri, 'street', deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - CREDIT ===', () => {
        const initialCreditUri = "https://gateway.lighthouse.storage/ipfs/bafkreia3r5yfzb3r4ixfzw35s76ktvjuf6v4zhug76ck2bgd5ypyx2faea";
        getTokenUri(initialCreditUri, 'credit', deployer, disp);

        const unauthorizedUri = "https://unauthorized-credit-uri.example.com";
        setTokenUri('credit', unauthorizedUri, wallet1);
        getTokenUri(initialCreditUri, 'credit', deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - STREET ===', () => {
        const initialStreetUri = "https://gateway.lighthouse.storage/ipfs/bafkreihore32ofrwm27vbeunjv5dgjdoexzpvbqu4rwt6dspn6aji4fmgy";
        getTokenUri(initialStreetUri, 'street', deployer, disp);

        const unauthorizedUri = "https://unauthorized-street-uri.example.com";
        setTokenUri('street', unauthorizedUri, wallet2);
        getTokenUri(initialStreetUri, 'street', deployer, disp);
    });
});
