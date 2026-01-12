import { describe, it } from "vitest";
import { MINT_AMOUNT, MINT_CAP } from "./vitestconfig"
import { streetMint } from "./functions/street-helper-functions";
import { disp } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== STREET MINT TESTS ===", () => {
    it("=== STREET MINT WITH AUTHORIZED SENDER ===", () => {
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);
    });

    it("=== STREET MINT WITH UNAUTHORIZED SENDER ===", () => {
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = 0;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, wallet1);
    });

    it("=== STREET MINT WITH ZERO AMOUNT ===", () => {
        const amountExpected = 0;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = 0;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);
    });

    it("=== STREET MINT EXCEEDS STREET MINT CAP ===", () => {
        const amountExpected = MINT_CAP + 1;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = 0;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);
    });
});