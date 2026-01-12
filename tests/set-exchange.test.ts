import { describe, it } from 'vitest';
import { setExchangeFee, setExchangeRev, setExchangeTax, getExchangeInfo } from './functions/exchange-helper-functions';
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('=== SET EXCHANGE TESTS ===', () => {
    it('=== SET EXCHANGE FEE PASS ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const newFee = 150;
        setExchangeFee(newFee, deployer, disp);
        getExchangeInfo(0, 0, newFee, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== SET EXCHANGE REV PASS ===', () => {
        // Check initial exchange info (default rev is 100)
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const newRev = 150;
        setExchangeRev(newRev, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, newRev, 100, deployer, disp);
    });

    it('=== SET EXCHANGE TAX PASS ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const newTax = 150;
        setExchangeTax(newTax, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, newTax, deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - SET EXCHANGE FEE ===', () => {

        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const unauthorizedFee = 75;
        setExchangeFee(unauthorizedFee, wallet1, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== ERR_INVALID_AMOUNT - SET EXCHANGE FEE HIGH ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const tooHighFee = 250; // MAX_FEE is 200
        setExchangeFee(tooHighFee, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== ERR_INVALID_AMOUNT - SET EXCHANGE FEE LOW ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const tooLowFee = 25; // MIN_FEE is 50
        setExchangeFee(tooLowFee, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== ERR_NOT_CONTRACT_OWNER - SET EXCHANGE REV ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const unauthorizedRev = 75;
        setExchangeRev(unauthorizedRev, wallet2, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== ERR_INVALID_AMOUNT - SET EXCHANGE REV HIGH ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const tooHighRev = 250; // MAX_REV is 200
        setExchangeRev(tooHighRev, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== ERR_INVALID_AMOUNT - SET EXCHANGE REV LOW ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
        
        const tooLowRev = 25; // MIN_REV is 50
        setExchangeRev(tooLowRev, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });


    it('=== ERR_NOT_CONTRACT_OWNER - SET EXCHANGE TAX ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const unauthorizedTax = 75;
        setExchangeTax(unauthorizedTax, wallet1, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== ERR_INVALID_AMOUNT - SET EXCHANGE TAX HIGH ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const tooHighTax = 250; // MAX_TAX is 200
        setExchangeTax(tooHighTax, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });

    it('=== ERR_INVALID_AMOUNT - SET EXCHANGE TAX LOW ===', () => {
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);

        const tooLowTax = 25; // MIN_TAX is 50
        setExchangeTax(tooLowTax, deployer, disp);
        getExchangeInfo(0, 0, 100, 0, 0, 0, 0, 100, 100, deployer, disp);
    });
});