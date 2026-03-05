import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateTrap } from "./trap-writer.js";

export function registerDroseraTools(server: McpServer) {

  // ─────────────────────────────────────────────
  // 1. WRITE TRAP — AI generates Solidity code
  // ─────────────────────────────────────────────

  server.registerTool(
    "drosera_write_trap",
    {
      description:
        "Use AI to write a custom Drosera Trap contract in Solidity from a plain-English description. " +
        "Returns the full Solidity source code, a matching drosera.toml config, and an explanation. " +
        "No wallet or deployment — just code generation.",
      inputSchema: {
        description: z
          .string()
          .min(10)
          .describe(
            "Plain-English description of what to monitor and what should trigger a response. " +
            "Example: 'Monitor a Uniswap V3 pool and trigger if liquidity drops by 20% in one block.'"
          ),
        target_contract_address: z
          .string()
          .optional()
          .describe("Address of the contract to monitor (0x...). Will be embedded as a constant."),
        target_contract_abi: z
          .string()
          .optional()
          .describe("Relevant ABI JSON snippet of the contract to monitor. Helps generate accurate interface calls."),
        block_sample_size: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .default(2)
          .describe("How many blocks of collect() history shouldRespond() receives. 1 = stateless, 2+ = trend detection."),
      },
    },
    async ({ description, target_contract_address, target_contract_abi, block_sample_size }) => {
      try {
        const trap = generateTrap({ description, contractAddress: target_contract_address, contractAbi: target_contract_abi, blockSampleSize: block_sample_size });

        const warnings = trap.warnings.length > 0
          ? `\n### ⚠️ Things to fill in before deploying\n${trap.warnings.map((w) => `- ${w}`).join("\n")}`
          : "";

        return {
          content: [{
            type: "text",
            text: [
              `## 🤖 Generated Trap: \`${trap.contractName}\``,
              "",
              `### What it does`,
              trap.explanation,
              warnings,
              "",
              `### \`src/${trap.contractName}.sol\``,
              "```solidity",
              trap.solidityCode,
              "```",
              "",
              `### \`drosera.toml\``,
              "```toml",
              trap.suggestedToml,
              "```",
            ].join("\n"),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `❌ Failed to generate trap: ${String(err)}` }],
        };
      }
    }
  );

  // ─────────────────────────────────────────────
  // 2. PROJECT SETUP GUIDE
  // ─────────────────────────────────────────────

  server.registerTool(
    "drosera_setup_guide",
    {
      description:
        "Returns a complete step-by-step guide to set up a Drosera Trap project from scratch — " +
        "what to install, the full file/folder structure, and how to run everything.",
      inputSchema: {
        os: z
          .enum(["mac", "linux", "windows"])
          .default("mac")
          .describe("Your operating system — affects install commands."),
        package_manager: z
          .enum(["npm", "bun", "yarn"])
          .default("npm")
          .describe("Package manager to use for installing JS dependencies."),
        trap_name: z
          .string()
          .optional()
          .default("MyTrap")
          .describe("Name of your trap contract — used in the example file structure."),
      },
    },
    async ({ os, package_manager, trap_name }) => {
      const isWindows = os === "windows";

      const curlDrosera = isWindows
        ? `# Windows: Download from https://github.com/drosera-network/releases/releases\n# and add to PATH manually`
        : `curl -L https://app.drosera.io/install | bash\nsource ~/.bashrc   # or restart your terminal`;

      const curlFoundry = isWindows
        ? `# Windows: Download from https://book.getfoundry.sh/getting-started/installation`
        : `curl -L https://foundry.paradigm.xyz | bash\nfoundryup`;

      const installCmd: Record<string, string> = {
        npm: "npm install",
        bun: "bun install",
        yarn: "yarn install",
      };

      const runCmd: Record<string, string> = {
        npm: "npm run build && npm start",
        bun: "bun run src/index.ts",
        yarn: "yarn build && yarn start",
      };

      return {
        content: [{
          type: "text",
          text: [
            `# Drosera Trap — Full Setup Guide (${os})`,
            "",

            `## Step 1 — Install prerequisites`,
            "",
            "### Foundry (Solidity compiler + test framework)",
            "```bash",
            curlFoundry,
            "```",
            "",
            "### Drosera CLI",
            "```bash",
            curlDrosera,
            "```",
            "",
            "Verify both are installed:",
            "```bash",
            "forge --version",
            "drosera --version",
            "```",
            "",

            `## Step 2 — Create the project`,
            "",
            "```bash",
            `mkdir ${trap_name.toLowerCase()}-trap`,
            `cd ${trap_name.toLowerCase()}-trap`,
            "forge init --no-git",
            "```",
            "",

            `## Step 3 — Install Drosera contracts`,
            "",
            "```bash",
            "forge install drosera-network/drosera-contracts",
            "```",
            "",
            "Then add the remapping so Solidity can find the imports:",
            "```bash",
            `echo 'drosera-contracts/=lib/drosera-contracts/src/' >> remappings.txt`,
            "```",
            "",

            `## Step 4 — File structure`,
            "",
            "Your project should look like this:",
            "```",
            `${trap_name.toLowerCase()}-trap/`,
            `├── src/`,
            `│   └── ${trap_name}.sol        ← your trap contract (generated by drosera_write_trap)`,
            `├── lib/`,
            `│   └── drosera-contracts/      ← installed by forge install`,
            `├── out/                        ← compiled artifacts (generated by forge build)`,
            `│   └── ${trap_name}.sol/`,
            `│       └── ${trap_name}.json`,
            `├── drosera.toml                ← trap config (generated by drosera_write_trap)`,
            `├── foundry.toml                ← forge config`,
            `└── remappings.txt`,
            "```",
            "",

            `## Step 5 — Add your trap code`,
            "",
            `Use the \`drosera_write_trap\` tool to generate \`${trap_name}.sol\` and \`drosera.toml\`.`,
            `Save \`${trap_name}.sol\` into the \`src/\` folder.`,
            `Save \`drosera.toml\` in the project root.`,
            "",
            "Then open `drosera.toml` and fill in:",
            "```toml",
            `[drosera]`,
            `eth_rpc_url = \"https://rpc.hoodi.ethpandaops.io\"   # or your Alchemy/QuickNode URL`,
            "",
            `[traps.${trap_name.toLowerCase()}]`,
            `path = \"out/${trap_name}.sol/${trap_name}.json\"`,
            `response_contract = \"0xYOUR_RESPONSE_CONTRACT\"     # ← fill this in`,
            `response_function = \"yourFunction()\"               # ← fill this in`,
            `block_sample_size = 2`,
            `min_number_of_operators = 1`,
            `max_number_of_operators = 5`,
            "```",
            "",

            `## Step 6 — Compile`,
            "",
            "```bash",
            "forge build",
            "```",
            "",
            "✅ You should see `Compiler run successful` and the `out/` folder gets created.",
            "",

            `## Step 7 — Test locally (no wallet needed)`,
            "",
            "```bash",
            "drosera test",
            "```",
            "",
            "This runs `collect()` and `shouldRespond()` against the live chain without submitting any transactions.",
            "",

            `## Step 8 — Deploy`,
            "",
            "```bash",
            "DROSERA_PRIVATE_KEY=0xYOUR_KEY drosera apply",
            "```",
            "",
            "After deploying, `drosera.toml` will be updated with your trap's on-chain address.",
            "",

            `## Step 9 — Fund the trap (Bloom Boost)`,
            "",
            "```bash",
            "DROSERA_PRIVATE_KEY=0xYOUR_KEY drosera hydrate --trap-address 0xYOUR_TRAP --amount 0.1",
            "```",
            "",
            "This deposits ETH to incentivise operators to monitor your trap.",
            "",

            `## Step 10 — Monitor`,
            "",
            "```bash",
            "drosera liveness --trap-address 0xYOUR_TRAP",
            "```",
            "",
            "Shows recent results from opted-in operators — whether `shouldRespond` was triggered.",
            "",

            `## Common errors`,
            "",
            "| Error | Fix |",
            "|---|---|",
            "| `forge: command not found` | Run `foundryup` and restart terminal |",
            "| `drosera: command not found` | Re-run the install curl and restart terminal |",
            "| `Cannot find module drosera-contracts` | Add the remapping in Step 3 |",
            "| `collect() reverted` | Check your target contract address is correct |",
            "| `Failed to get forecast URL` | Your RPC URL may be wrong or rate-limited |",
          ].join("\n"),
        }],
      };
    }
  );

  // ─────────────────────────────────────────────
  // 3. EXPLAIN TRAP INTERFACE
  // ─────────────────────────────────────────────

  server.registerTool(
    "drosera_explain_interface",
    {
      description:
        "Explains the Drosera ITrap interface — what collect() and shouldRespond() do, " +
        "the rules they must follow, and shows a minimal working example. " +
        "Great starting point before writing a custom trap.",
      inputSchema: {},
    },
    async () => {
      return {
        content: [{
          type: "text",
          text: [
            `# The Drosera ITrap Interface`,
            "",
            "Every Drosera Trap must implement two functions:",
            "",
            "```solidity",
            "// SPDX-License-Identifier: UNLICENSED",
            "pragma solidity ^0.8.20;",
            "",
            "interface ITrap {",
            "    function collect() external view returns (bytes memory);",
            "    function shouldRespond(bytes[] calldata data) external pure returns (bool, bytes memory);",
            "}",
            "```",
            "",
            "---",
            "",
            "## `collect()`",
            "- Called **every block** by Drosera operators",
            "- Must be `view` — read chain state only, no writes",
            "- Returns any data you want encoded as `bytes` (use `abi.encode`)",
            "- Think of it as a **snapshot** of the state you care about",
            "",
            "## `shouldRespond(bytes[] calldata data)`",
            "- Called with the last N `collect()` results (`block_sample_size` determines N)",
            "- `data[0]` = most recent block, `data[N-1]` = oldest",
            "- Must be `pure` — no state reads, only works with the provided data",
            "- Returns `(true, responseData)` to trigger the response contract",
            "- Returns `(false, bytes(\"\"))` when no action needed",
            "",
            "---",
            "",
            "## Minimal example — monitor an ETH balance",
            "",
            "```solidity",
            "// SPDX-License-Identifier: UNLICENSED",
            "pragma solidity ^0.8.20;",
            "",
            "import \"drosera-contracts/interfaces/ITrap.sol\";",
            "",
            "contract BalanceGuardTrap is ITrap {",
            "    address public constant TARGET = 0x1234567890123456789012345678901234567890;",
            "    uint256 public constant THRESHOLD = 1 ether;",
            "",
            "    struct Snapshot {",
            "        uint256 balance;",
            "    }",
            "",
            "    // collect: snapshot the balance every block",
            "    function collect() external view returns (bytes memory) {",
            "        return abi.encode(Snapshot({ balance: TARGET.balance }));",
            "    }",
            "",
            "    // shouldRespond: trigger if balance drops below threshold",
            "    function shouldRespond(bytes[] calldata data) external pure returns (bool, bytes memory) {",
            "        if (data.length == 0) return (false, bytes(\"\"));",
            "        Snapshot memory latest = abi.decode(data[0], (Snapshot));",
            "        if (latest.balance < THRESHOLD) {",
            "            return (true, abi.encode(\"Balance below threshold\"));",
            "        }",
            "        return (false, bytes(\"\"));",
            "    }",
            "}",
            "```",
            "",
            "---",
            "",
            "## Rules summary",
            "",
            "| Rule | collect() | shouldRespond() |",
            "|---|---|---|",
            "| Can read chain state | ✅ | ❌ |",
            "| Can write state | ❌ | ❌ |",
            "| Receives previous blocks | ❌ | ✅ via `data[]` |",
            "| Mutability | `view` | `pure` |",
            "",
            "---",
            "",
            `Use \`drosera_write_trap\` to generate a full trap from a plain-English description.`,
            `Use \`drosera_setup_guide\` to get the full project setup walkthrough.`,
          ].join("\n"),
        }],
      };
    }
  );
}

// ─────────────────────────────────────────────
// 4. DOCS — query embedded official documentation
// ─────────────────────────────────────────────

import { queryDocs, listTopics } from "./docs.js";

export function registerDocsTool(server: McpServer) {
  server.registerTool(
    "drosera_docs",
    {
      description:
        "Query the official Drosera documentation embedded directly in this MCP server. " +
        "Covers: getting started, CLI commands, creating/updating/hydrating/boosting traps, " +
        "dryrun, kicking operators, private traps, bloom boost percentage, liveness data, " +
        "recovering drosera.toml, configuring alerts, operator installation, registration, " +
        "running on VPS, Docker, and monitoring. No internet required.",
      inputSchema: {
        topic: z
          .string()
          .describe(
            "The topic to look up. Examples: 'getting started', 'hydrate', 'private trap', " +
            "'bloomboost', 'liveness', 'alerts', 'operator docker', 'recover toml', 'dryrun'. " +
            "Pass 'list' to see all available topics."
          ),
      },
    },
    async ({ topic }) => {
      if (topic.toLowerCase() === "list") {
        return {
          content: [{
            type: "text",
            text: `## Available Drosera Documentation Topics\n\n${listTopics().map((t) => `- ${t}`).join("\n")}`,
          }],
        };
      }

      const doc = queryDocs(topic);

      if (!doc) {
        return {
          content: [{
            type: "text",
            text: [
              `## No docs found for: "${topic}"`,
              "",
              "Try one of these topics:",
              listTopics().map((t) => `- ${t}`).join("\n"),
            ].join("\n"),
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: doc.content,
        }],
      };
    }
  );
}