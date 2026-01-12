import { describe, it } from "vitest";
import { disp, MINT_AMOUNT } from "./vitestconfig"
import { streetMint } from "./functions/street-helper-functions";
import { getBalance, getTotalSupply, getContractOwner, getDecimals, getName, getSymbol, getTokenUri } from "./functions/shared-read-only-helper-functions";
import { getBlocks, getExchangeInfo } from "./functions/exchange-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== SHARED READ ONLY FUNCTION TESTS ===", () => {
    it("=== GET BALANCE PRINCIPAL ===", () => {
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        const mintedAmount = streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);
        const balanceExpected = mintedAmount;
        getBalance(balanceExpected, 'street', deployer, deployer, disp);
    });

    it('=== GET BLOCKS PASS ===', () => {
        getBlocks(deployer, disp);
    });

    it("=== GET EXCHANGE INFO ===", () => {
        const availAExpected = 0;
        const availBExpected = 0;
        const feeExpected = 100;
        const lockedAExpected = 0;
        const lockedBExpected = 0;
        const reserveAExpected = 0;
        const reserveBExpected = 0;
        const revenueExpected = 100;
        const taxExpected = 100;
        getExchangeInfo(
            availAExpected,
            availBExpected,
            feeExpected,
            lockedAExpected,
            lockedBExpected,
            reserveAExpected,
            reserveBExpected,
            revenueExpected,
            taxExpected,
            deployer,
            disp
        );
    })

    it("=== GET TOTAL SUPPLY ===", () => {
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        const totalSupplyExpected = streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);
        getTotalSupply(totalSupplyExpected, 'street', deployer, disp);
    });

    it("=== GET CONTRACT OWNER ===", () => {
        const contractOwnerExpected = deployer;
        getContractOwner(contractOwnerExpected, 'street', deployer, disp);
    });

    it("=== GET DECIMALS ===", () => {
        const decimalsExpected = 6;
        getDecimals(decimalsExpected, 'street', deployer, disp);
    });

    it("=== GET NAME ===", () => {
        const nameExpected = "Welsh Street";
        getName(nameExpected, 'street', deployer, disp);
    });

    it("=== GET SYMBOL ===", () => {
        const symbolExpected = "STREET";
        getSymbol(symbolExpected, 'street', deployer, disp);
    });

    it("=== GET TOKEN URI ===", () => {
        const tokenUriExpected = "https://gateway.lighthouse.storage/ipfs/bafkreihore32ofrwm27vbeunjv5dgjdoexzpvbqu4rwt6dspn6aji4fmgy";
        getTokenUri(tokenUriExpected, 'street', deployer, disp);
    });
});