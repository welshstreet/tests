import { describe, it } from 'vitest';
import { disp } from './vitestconfig';
import { setClaimActive, setContributeActive, getClaimActive, getContributeActive } from './functions/genesis-helper-functions';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('=== SET GENESIS TESTS ===', () => {
    it('=== SET CLAIM ACTIVE PASS ===', () => {
        // STEP 1: Verify initial state (claim-active starts as false)
        getClaimActive(false, deployer, disp);

        // STEP 2: Toggle claim-active to true as contract owner
        setClaimActive(true, deployer, disp);

        // STEP 3: Verify claim-active is now true
        getClaimActive(true, deployer, disp);

        // STEP 4: Toggle claim-active back to false as contract owner
        setClaimActive(false, deployer, disp);

        // STEP 5: Verify claim-active is now false again
        getClaimActive(false, deployer, disp);
    });
    
    it('=== SET CLAIM ACTIVE ERR_NOT_CONTRACT_OWNER ===', () => {
        // STEP 1: Verify initial state (claim-active starts as false)
        getClaimActive(false, deployer, disp);

        // STEP 2: Try to toggle claim-active as non-owner (should fail with ERR_NOT_CONTRACT_OWNER - 501)
        // Using expectedNewState: false since we expect error
        setClaimActive(false, wallet1, disp);

        // STEP 3: Verify claim-active remains unchanged (still false)
        getClaimActive(false, deployer, disp);
    });
    
    it('=== SET CONTRIBUTE ACTIVE PASS ===', () => {
        // STEP 1: Verify initial state (contribute-active starts as true)
        getContributeActive(true, deployer, disp);

        // STEP 2: Toggle contribute-active to false as contract owner
        setContributeActive(false, deployer, disp);

        // STEP 3: Verify contribute-active is now false
        getContributeActive(false, deployer, disp);

        // STEP 4: Toggle contribute-active back to true as contract owner
        setContributeActive(true, deployer, disp);

        // STEP 5: Verify contribute-active is now true again
        getContributeActive(true, deployer, disp);
    });
    
    it('=== SET CONTRIBUTE ACTIVE ERR_NOT_CONTRACT_OWNER ===', () => {
        // STEP 1: Verify initial state (contribute-active starts as true)
        getContributeActive(true, deployer, disp);

        // STEP 2: Try to toggle contribute-active as non-owner (should fail with ERR_NOT_CONTRACT_OWNER - 501)
        // Using expectedNewState: true since we expect error
        setContributeActive(true, wallet1, disp);

        // STEP 3: Verify contribute-active remains unchanged (still true)
        getContributeActive(true, deployer, disp);
    });
});