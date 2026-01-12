import { describe, it } from "vitest";
import { disp, TRANSFER_STREET } from "./vitestconfig";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { transfer } from "./functions/transfer-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== STREET TRANSFER TESTS ===", () => {
    it("=== STREET TRANSFER PASS ===", () => {
        // STEP 1: Setup initial liquidity (this mints STREET tokens to deployer)
        setupInitialLiquidity(disp);

        // STEP 2: Transfer STREET tokens from deployer to wallet1
        // Deployer should have STREET tokens from the setup process
        const transferAmount = TRANSFER_STREET;

        transfer(
            transferAmount,
            'street',
            deployer,
            wallet1,
            disp
        );
    });
});
