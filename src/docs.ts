/**
 * docs.ts
 * 
 * Official Drosera documentation embedded directly into the MCP.
 * No web search needed — always accurate, always available offline.
 */

export interface DocEntry {
  topic: string;
  aliases: string[];
  content: string;
}

export const DOCS: DocEntry[] = [
  {
    topic: "get_started",
    aliases: ["getting started", "install", "setup", "foundry", "droseraup", "init"],
    content: `# Getting Started

## Installing Droseraup
Droseraup is the Drosera CLI installer.

\`\`\`bash
curl -L https://app.drosera.io/install | bash
\`\`\`

Follow the on-screen instructions to make \`droseraup\` available in your CLI.

> Windows users must use WSL — Droseraup does not support Windows natively.

Running \`droseraup\` alone installs the latest drosera binary. Use \`droseraup --h\` for version options.

## Install Foundry
\`\`\`bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
\`\`\`

## Initialize a Drosera Project
\`\`\`bash
mkdir my-drosera-trap
cd my-drosera-trap
forge init -t drosera-network/trap-foundry-template
\`\`\`

This uses the official Drosera Trap Foundry Template to scaffold a ready-to-go project.`
  },

  {
    topic: "drosera_cli",
    aliases: ["cli", "drosera.toml", "config", "configuration", "commands", "private key", "toml"],
    content: `# Drosera CLI

The Drosera CLI creates, manages, and monitors Traps on the Drosera Network.

## drosera.toml Configuration

\`\`\`toml
ethereum_rpc = "http://examplerpc.io"
drosera_rpc = "https://relayer.testnet.drosera.io"

[traps]

[traps.hello_world]
path = "out/HelloWorldTrap.sol/HelloWorldTrap.json"
response_contract = "0xea08f7d533C2b9A62F40D5326214f39a8E3A32F8"
response_function = "pause(uint256)"
cooldown_period_blocks = 33
min_number_of_operators = 1
max_number_of_operators = 2
block_sample_size = 10
private_trap = false
whitelist = []
\`\`\`

## Using .toml.j2 for Environment Variables
\`\`\`toml
ethereum_rpc = "{{env.ETHEREUM_RPC_URL}}"
drosera_rpc = "https://relayer.testnet.drosera.io"
private_key = "{{env.DROSERA_PRIVATE_KEY}}"
\`\`\`

## Config Fields
- **ethereum_rpc**: Ethereum RPC URL (must start with "http://")
- **drosera_rpc**: Drosera seed node URL
- **eth_chain_id** (optional): Chain ID — auto-derived if omitted
- **drosera_address** (optional): Core Drosera contract address — auto-derived if omitted

## Trap Fields
- **path**: Path to compiled trap JSON (ABI + bytecode)
- **response_contract**: Address to call when trap triggers
- **response_function**: Function signature to call
- **cooldown_period_blocks**: Blocks to wait before triggering again
- **min_number_of_operators**: Minimum operators needed to trigger response
- **max_number_of_operators**: Max operators that can opt in
- **block_sample_size**: Blocks of data passed to shouldRespond
- **private_trap**: true = private, false = public (default)
- **whitelist**: Array of operator addresses allowed to opt in

## Private Key Setup
\`\`\`bash
export DROSERA_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
\`\`\`

## CLI Arguments
- **--config-path (-c)**: Path to drosera.toml
- **--non-interactive (-n)**: Skip user prompts

## Precedence Order
1. Command line arguments
2. drosera.toml config file
3. Environment variables / .env file

## Commands Summary
- **config** — Display current config
- **plan** — Preview what will be created/updated
- **dryrun** — Test trap locally without transactions
- **apply** — Deploy or update traps on-chain
- **hydrate** — Fund trap with DRO tokens
- **bloomboost** — Boost trap with ETH for gas reimbursement
- **kick-operator** — Remove operator from trap
- **set-bloomboost-limit** — Set ETH bloom boost percentage
- **liveness** — Get operator liveness data
- **recover** — Reconstruct drosera.toml from on-chain state
- **dispute** — Dispute an optimistic claim using ZK proof
- **zkclaim** — Perform ZK incident response`
  },

  {
    topic: "creating_a_trap",
    aliases: ["create trap", "trap anatomy", "collect", "shouldrespond", "shouldalert", "deploy trap", "event logs", "trap contract"],
    content: `# Creating a Trap

## Trap Anatomy

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct EventLog {
    bytes32[] topics;
    bytes data;
    address emitter;
}

struct EventFilter {
    address contractAddress;
    string signature;
}

abstract contract Trap {
    function collect() external view virtual returns (bytes memory);
    function shouldRespond(bytes[] calldata data) external pure virtual returns (bool, bytes memory);
    function shouldAlert(bytes[] calldata data) external pure virtual returns (bool, bytes memory);
    function eventLogFilters() public view virtual returns (EventFilter[] memory);
    function version() public pure returns (string memory) { return "2.0"; }
}
\`\`\`

## collect()
- Called **every block** by operators
- Must be \`external view\` — read only, no state changes
- Returns \`bytes memory\` — use \`abi.encode()\` with a struct
- State changes are only permitted in the constructor

\`\`\`solidity
function collect() external view returns (bytes memory) {
    uint256 totalSupply = IERC20(0x1234).totalSupply();
    return abi.encode(totalSupply);
}
\`\`\`

## shouldRespond()
- Called with array of last N collect() results (block_sample_size)
- **data[0]** = most recent block, **data[N-1]** = oldest
- Must be \`external pure\` — no state reads
- Returns \`(bool, bytes memory)\` — true = trigger response

\`\`\`solidity
function shouldRespond(bytes[] calldata data) external pure returns (bool, bytes memory) {
    uint256 totalSupply = abi.decode(data[0], (uint256));
    if (totalSupply < 1000000) {
        return (true, abi.encode(totalSupply));
    }
    return (false, abi.encode(""));
}
\`\`\`

## shouldAlert()
- Identical behavior to shouldRespond
- Used for notifications (Slack, webhooks) instead of on-chain response
- See Configuring Alerts section

## Event Logs
Use \`getEventLogs()\` inside collect() to access block event logs:

\`\`\`solidity
function collect() external view override returns (bytes memory) {
    EventLog[] memory logs = getEventLogs();
    EventFilter[] memory filters = eventLogFilters();
    // process logs...
}
\`\`\`

## eventLogFilters()
Define which events to receive:

\`\`\`solidity
function eventLogFilters() public pure returns (EventFilter[] memory) {
    EventFilter[] memory filters = new EventFilter[](1);
    filters[0] = EventFilter({
        contractAddress: address(0x1234),
        signature: "Transfer(address,address,uint256)"
    });
    return filters;
}
\`\`\`

## Deploying
\`\`\`bash
drosera apply
\`\`\`

Successful output:
\`\`\`
1. Created Trap Config for basic_trap: (Gas Used: 1,678,320)
  - address: 0x7ab4C4804197531f7ed6A6bc0f0781f706ff7953
  - block: 321
\`\`\`

**Limits:** 3000 account queries and 3000 storage slot queries per block per trap.`
  },

  {
    topic: "updating_a_trap",
    aliases: ["update trap", "update", "change trap", "modify trap", "redeploy"],
    content: `# Updating a Trap

After deploying, you can update a trap's bytecode, response contract, function, or any config value.

## How to Update
Make your changes to the Solidity file or drosera.toml, then run:

\`\`\`bash
drosera apply
\`\`\`

## What Triggers Operator Restart
If any of these change, operators automatically restart trap execution:
- Trap bytecode
- Seed Node DNR (changes when drosera_rpc arg changes)
- block_sample_size

This is automatic — operators detect the update event on their own.

## Cooldown Period
- After updating, a **32 block cooldown** applies before another update is allowed
- This prevents too-frequent updates and gives operators time to adjust

## Address Field
- If \`address\` is present in drosera.toml → trap is **updated**
- If \`address\` is absent → a **new trap** is created

The address is automatically written to drosera.toml after first deploy.`
  },

  {
    topic: "hydrating_a_trap",
    aliases: ["hydrate", "hydration", "rewards", "dro", "incentivize operators", "fund trap"],
    content: `# Hydrating a Trap

Drosera acts as a marketplace between Trappers and Operators. Hydration Streams are the main reward mechanism.

## How Hydration Works
When you create a hydration stream, you fund the trap with DRO tokens. The balance streams to operators over time.

### Passive Rewards
Distributed evenly to all opted-in operators continuously.

### Active Rewards
A bonus pool accumulates from hydration streams. Given to operators who submit responses on-chain first.

### Staking Rewards
A portion streams to the Drosera staking rewards pool.

## Creating a Hydration Stream
\`\`\`bash
drosera hydrate --trap-address <address> --dro-amount <amount>
\`\`\`

- Vesting schedule: **30 days** — stream completes after 30 days
- Minimum DRO amount is set by the Drosera team
- Multiple users can create hydration streams on the same trap
- Available via CLI and the Drosera frontend`
  },

  {
    topic: "boosting_a_trap",
    aliases: ["boost", "bloomboost", "bloom boost", "gas reimbursement", "eth boost", "priority"],
    content: `# Boosting a Trap (Bloom Boost)

Bloom Boost provides operators with ETH gas reimbursement for on-chain response actions.

## How It Works
By depositing ETH into a trap's bloom boost balance:
- Operators are automatically reimbursed for the gas cost of the response function
- Reimbursement = gas used × current gas price
- Priority fee incentivizes block builders to include the tx quickly

## Why It Matters
For mainnet, most operators use the \`--gas-reimbursement-required\` flag — meaning they will **only** execute traps that are boosted. Without bloom boost, your trap may not get executed on mainnet.

## How to Boost
\`\`\`bash
drosera bloomboost --trap-address <address> --eth-amount <amount>
\`\`\`
Amount is in ETH (not wei).`
  },

  {
    topic: "dryrun",
    aliases: ["dry run", "dryrun", "test trap", "local test", "simulate", "block number", "theory craft"],
    content: `# Dryrunning a Trap

Test your trap with real block data locally before deploying — no transactions sent.

## How It Works
Spins up a local ad-hoc operator that runs two lifecycles:

### Bootstrap Lifecycle (first run)
- Fetches each block from your RPC
- Runs collect() on each block
- Fetches account/slot data one by one as needed
- Caches all account addresses and slot indexes

### Runtime Lifecycle (subsequent runs)
- Uses cached account/slot data
- Pre-fetches in batch — much faster
- Reflects real deployed operator behavior

## Run Dryrun
\`\`\`bash
drosera dryrun
\`\`\`

## Historical Testing (Theory-crafting)
\`\`\`bash
drosera dryrun --block-number <block_number>
\`\`\`
> Requires an archive node RPC if testing old blocks.

## Output Fields
- **trap_name** — trap identifier
- **result** — execution result
- **trap_address** — zero if not yet deployed
- **block_number** — block shouldRespond ran on
- **block_hash** — hash of that block
- **trap_hash** — hash of trap bytecode
- **should_respond** — whether trap would trigger
- **response_data** — data from shouldRespond
- **should_alert** — whether trap would alert
- **alert_data** — data from shouldAlert
- **bootstrap duration** — first lifecycle time (one-time cost)
- **runtime duration** — normal lifecycle time
- **collect() gas used**
- **shouldRespond() gas used**
- **accounts queried**
- **slots queried**
- **event logs queried**

## Gas Limits
- collect(): up to **1 billion gas**
- shouldRespond(): up to **1 billion gas**
- ~66× more gas than an entire Ethereum block

## Performance Warning
If runtime lifecycle exceeds the recommended upper time limit, dryrun emits a warning. If this happens, deployed operators may struggle to keep up with 12-second Ethereum block times.`
  },

  {
    topic: "kicking_an_operator",
    aliases: ["kick operator", "kick", "remove operator", "ban operator", "opt out operator"],
    content: `# Kicking an Operator

Remove an operator from your trap so they can no longer execute it.

## Steps to Kick

1. **Identify the operator address**
   - Protocol-level operators: find their address (not in whitelist if trap is public)
   - Trap-level operators: they will be in your whitelist in drosera.toml

2. **If trap-level operator**: remove their address from \`whitelist\` in drosera.toml and run:
   \`\`\`bash
   drosera apply
   \`\`\`

3. **Run kick-operator**:
   \`\`\`bash
   drosera kick-operator --trap-address <address> --operators <operator1> <operator2>
   \`\`\`
   Separate multiple operator addresses with spaces.

## Important Notes
- If you kick a trap-level operator **without** removing them from the whitelist, they can simply opt back in
- To permanently block an operator: remove from whitelist AND kick
- To restrict who can opt in entirely: set \`private_trap = true\` in drosera.toml`
  },

  {
    topic: "private_trap",
    aliases: ["private", "whitelist", "private trap", "public trap", "access control", "operator whitelist"],
    content: `# Private Traps

Control who can opt in and run your trap.

## Default: Public Trap (\`private_trap = false\`)
- All **protocol-level operators** can opt in
- Protocol-level operators are hand-picked by Drosera — enterprise-grade, high uptime
- Trap-level operators (non-protocol) can only opt in if explicitly whitelisted

## Private Trap (\`private_trap = true\`)
- **No one** can opt in unless explicitly added to the whitelist
- Even protocol-level operators are blocked unless whitelisted

## Operator Types

| | Protocol-Level Operators | Trap-Level Operators |
|---|---|---|
| **Public trap** | All can opt in | Only if whitelisted |
| **Private trap** | Only if whitelisted | Only if whitelisted |

## Setting Up a Private Trap
In drosera.toml:
\`\`\`toml
[traps.my_trap]
private_trap = true
whitelist = ["0xOperatorAddress1", "0xOperatorAddress2"]
\`\`\`

Then deploy:
\`\`\`bash
drosera apply
\`\`\`

## Use Cases
- Run exclusively your own infrastructure
- Keep trap bytecode confidential
- Allow specific trusted operators only
- Mix protocol-level and custom operators`
  },

  {
    topic: "bloomboost_percentage",
    aliases: ["bloomboost limit", "set bloomboost", "bloomboost percentage", "bps", "basis points", "bloom boost limit"],
    content: `# Setting Bloom Boost Percentage

Controls what percentage of your trap's ETH balance is used to incentivize block builders.

> Only applicable on Ethereum mainnet. Default is 0 BPS (0%).

## How It Works
When a trap triggers and the response function is called:
1. Operator pays the gas cost upfront
2. Operator is reimbursed from the trap's ETH balance
3. The bloom boost percentage of the **remaining** balance is sent to the block builder

## Example
- Trap has 10 ETH bloom boosted
- Response gas cost = 1 ETH
- Operator is reimbursed 1 ETH → 9 ETH remains
- Bloom boost limit = 50% (5000 BPS)
- 4.5 ETH sent to block proposer (50% of 9 ETH)

## Setting the Limit
\`\`\`bash
drosera set-bloomboost-limit --trap-address <address> --limit <bps>
\`\`\`

\`limit\` is an integer in basis points (BPS):
- 10000 BPS = 100%
- 5000 BPS = 50%
- 3100 BPS = 31%
- 0 BPS = 0% (default)

**Formula**: percentage × 100 = BPS (e.g. 51.02% × 100 = 5102 BPS)

## Strategy
- Higher value contracts → more ETH + higher percentage
- Especially important during high gas / congestion periods
- Most mainnet operators require bloom boost to execute your trap`
  },

  {
    topic: "liveness_data",
    aliases: ["liveness", "operator health", "monitoring operators", "operator performance", "non signers", "attestations"],
    content: `# Getting Liveness Data

Check how actively operators are executing your trap every block.

## What is Liveness?
In a decentralized system, operators may occasionally miss blocks due to network issues. Liveness data shows how consistently each opted-in operator is submitting trap results.

## Command
\`\`\`bash
drosera liveness --trap-address <address>
\`\`\`

Optional historical lookup:
\`\`\`bash
drosera liveness --trap-address <address> --block-number <block>
\`\`\`

## Default Range
Without \`--block-number\`, returns results for \`block_sample_size\` blocks ending at \`current block - 1\`.
(The -1 gives time for p2p attestations to propagate before querying.)

## Output Fields per Result
- **trap_address** — address of the trap config
- **block_number** — block the result covers
- **block_hash** — hash of that block
- **should_respond** — whether operator computed a response should trigger
- **response_data** — data from shouldRespond (if should_respond = true)
- **trap_hash** — hash of trap bytecode
- **collect_output** — raw output of collect()
- **operator** — address of the operator that submitted this result
- **failure** — whether execution failed
- **failure_reason** — reason for failure if any
- **non_signers** — operators that did NOT submit a result for this block

## What to Look For
- **non_signers**: If an operator frequently appears here → unreliable, consider kicking them
- **failure: true** → operator is having issues executing your trap
- Missing results for many consecutive blocks → operator may be down

> Note: Historical data is pruned regularly — only recent blocks have data.`
  },

  {
    topic: "recovering_toml",
    aliases: ["recover", "recover toml", "lost toml", "reconstruct toml", "recovery", "drosera.toml lost"],
    content: `# Recovering Your drosera.toml

If your drosera.toml is deleted or corrupted, you can reconstruct it from on-chain state.

## How to Recover
\`\`\`bash
drosera recover --eth-rpc-url <rpc_url> --private-key 0x<your_private_key>
\`\`\`

Optional — specify output path:
\`\`\`bash
drosera recover --eth-rpc-url <rpc_url> --private-key 0x<key> --write-path ./recovered_drosera.toml
\`\`\`

Default output file: \`./recovered_drosera.toml\`

## What Gets Recovered
- All trap data owned by the provided private key
- Configuration values stored on-chain
- Trap addresses

## What Does NOT Get Recovered (Lossy Reconstruction)
- The **path** field — points to compiled files on your local machine, not stored on-chain
- Any local-only config values

## After Recovery
1. Open the recovered file
2. Re-specify the \`path\` field for each trap pointing to your compiled \`.json\` artifact
3. Rename file to \`drosera.toml\`

## Multi-Key Note
- Only traps deployed with the **provided private key** are recovered
- Run the command separately for each private key if you used multiple keys
- All traps under one key will be recovered into one file, even if they were originally in separate files`
  },

  {
    topic: "configuring_alerts",
    aliases: ["alerts", "shouldalert", "slack", "webhook", "notifications", "alert config", "alert output", "severity"],
    content: `# Configuring Alerts

Alerts notify you via Slack or webhooks when your trap's shouldAlert function returns true.

## How Alerts Work
1. Operators execute \`shouldAlert()\` every block
2. If it returns true → operator sends alert data to the Drosera alert server
3. Alert server forwards to your configured channels (Slack, webhook)
4. Alerts can be updated without any on-chain changes

## Implementing shouldAlert in Your Trap
\`\`\`solidity
function shouldAlert(bytes[] calldata data) external pure override returns (bool, bytes memory) {
    if (data.length == 0) return (false, bytes(""));
    
    CollectOutput memory latest = abi.decode(data[data.length - 1], (CollectOutput));
    
    if (latest.liquidity < 1000 ether) {
        return (true, abi.encode(latest));
    }
    return (false, bytes(""));
}

// Required: decoder function so alert server knows how to parse alertData
function decodeAlertOutput(bytes calldata data) public pure returns (CollectOutput memory) {
    return abi.decode(data, (CollectOutput));
}
\`\`\`

## drosera.toml Alert Configuration
\`\`\`toml
[traps.my_trap.alert]
title = "Low Liquidity Alert"
severity = "high"        # low | medium | high | critical
enabled = true
labels = { "pool" = "ETH/USD", "description" = "Liquidity below threshold" }
alert_output_sig = "decodeAlertOutput"

# Users who can manage this alert on app.drosera.io
users = [
  { address = "0x1234..." }
]

# Slack
slack = { slack_channel = "#drosera-alerts" }

# Webhook
webhook = { 
  webhook_url = "https://your-server.com/webhook",
  webhook_headers = { "Authorization" = "Bearer token" }
}
\`\`\`

## Severity Levels
- **low** 👋 — informational
- **medium** ⚠️ — review soon
- **high** ❗ — prompt attention needed
- **critical** 🚨 — immediate action required

## Webhook Payload
\`\`\`json
{
  "trap_address": "0x...",
  "block_number": 12345678,
  "owner": "0x...",
  "title": "Low Liquidity Alert",
  "severity": "high",
  "chain_id": 1,
  "labels": { "pool": "ETH/USD" },
  "response_data": { "liquidity": "500000000000000000" }
}
\`\`\`

## Setting Up Slack
1. Configure \`slack\` in drosera.toml
2. Run \`drosera apply\`
3. Go to https://app.drosera.io/alerts
4. Connect wallet → click "Install Slack App"
5. Authorize in your workspace → select channel

## Testing
\`\`\`bash
# Test alert logic without sending notifications
drosera dryrun --trap-name my_trap

# Send test notification to verify channels work
drosera send-test-alert --trap-name my_trap
\`\`\`

## Enabling / Disabling
\`\`\`toml
[traps.my_trap.alert]
enabled = false   # trap still runs, no alerts sent
\`\`\`
Run \`drosera apply\` after any change.

## Deleting an Alert
Remove or comment out the \`[traps.my_trap.alert]\` section, then run \`drosera apply\`.`
  },

  {
    topic: "operator_installation",
    aliases: ["operator install", "install operator", "drosera-operator", "operator binary", "docker operator", "system requirements"],
    content: `# Operator Installation

The Drosera Operator runs on **Linux only**.

## Recommended System Requirements
- 2 CPU Cores
- 4 GB RAM
- 20 GB Disk Space

Currently only **Ubuntu 22.04+** is officially supported.

## Option 1: Pre-built Binary
\`\`\`bash
cd ~
curl -LO https://github.com/drosera-network/releases/releases/download/v1.0.2/drosera-operator-v1.0.2-x86_64-unknown-linux-gnu.tar.gz
tar -xvf drosera-operator-v1.0.2-x86_64-unknown-linux-gnu.tar.gz
./drosera-operator --version

# Optional: add to PATH
sudo cp drosera-operator /usr/bin
\`\`\`

## Option 2: Docker
\`\`\`bash
docker pull ghcr.io/drosera-network/drosera-operator:latest
docker run ghcr.io/drosera-network/drosera-operator --help
\`\`\`

## Installing via droseraup (recommended for VPS)
\`\`\`bash
curl -L https://app.drosera.io/install | bash
source ~/.bashrc
droseraup
\`\`\``
  },

  {
    topic: "operator_register",
    aliases: ["register operator", "operator registration", "bls key", "register"],
    content: `# Register as an Operator

Before running the Drosera Operator Node, you must register.

\`\`\`bash
drosera-operator register --eth-rpc-url <rpc-url> --eth-private-key <private-key>
\`\`\`

This registers your BLS public key (derived from your private key) with the Drosera contracts. The BLS key is used to sign attestations and reach consensus.

## Important Key Warning
> Do NOT use your restaking EOA private key for registration. Use a **separate** dedicated private key for operator registration and operations.

## With Root Operator (optional)
\`\`\`bash
drosera-operator register --eth-rpc-url <rpc-url> --eth-private-key <private-key> --root-operator-address 0x<root_address>
\`\`\`

Root operators consolidate rewards from multiple operators into one address — one claim for all.`
  },

  {
    topic: "operator_run",
    aliases: ["run operator", "start operator", "operator node", "operator config", "drosera-operator node"],
    content: `# Run the Drosera Operator Node

\`\`\`bash
drosera-operator node
\`\`\`

Successful start output:
\`\`\`
INFO drosera_operator::node: Operator Node successfully spawned!
\`\`\`

## Key CLI Arguments
- **--eth-rpc-url** — Ethereum RPC for transactions
- **--eth-backup-rpc-url** — Backup RPC (optional)
- **--eth-private-key** — Signing key (never put in drosera.toml)
- **--network-external-p2p-address** — Your public IP/domain (REQUIRED for discoverability)
- **--network-p2p-port** — P2P port (default: 31313)
- **--server-port** — RPC server port (default: 31314)
- **--gas-reimbursement-required** — Require bloom boost to execute (default: false)
- **--data-dir** — Persistence directory (default: ./.drosera/data)
- **--dev-mode** — Run without persisting data
- **--log-level** — info | warn | error | debug | trace

## Environment Variables (prefix: DRO__)
\`\`\`bash
export DRO__ETH__PRIVATE_KEY=0x...
export DRO__ETH__RPC_URL=http://localhost:8545
export DRO__NETWORK__EXTERNAL_P2P_ADDRESS=your.public.ip
export DRO__NETWORK__P2P_PORT=31313
export DRO__SERVER__PORT=31314
\`\`\`

## TOML Config File
\`\`\`toml
[eth]
rpc_url = "http://localhost:8545"

[network]
p2p_port = 31313
external_p2p_address = ""  # Required
secret_key = ""            # Required

[server]
port = 31314
\`\`\``
  },

  {
    topic: "operator_optin",
    aliases: ["opt in", "optin", "opt out", "optout", "executing traps", "trap execution", "root operator"],
    content: `# Executing Traps — Opt In / Opt Out

## Opt Into a Trap
\`\`\`bash
drosera-operator optin --eth-rpc-url <rpc-url> --eth-private-key <private-key> --trap-config-address <trap-address>
\`\`\`

Success output:
\`\`\`
INFO drosera_operator::opt_in: Opted in successfully!
\`\`\`

Once opted in, the running operator node will automatically detect the event and start executing the trap.

## Opt Out of a Trap
\`\`\`bash
drosera-operator optout --eth-rpc-url <rpc-url> --eth-private-key <private-key> --trap-config-address 0x<trap-address>
\`\`\`

## Requirements to Opt In
1. Register as an Operator
2. Get whitelisted by Drosera team (permissionless coming soon)
3. Run the Drosera Operator Node
4. Run the optin command

## Root Operator (Multiple Operators)
Consolidate rewards from multiple operators into one address:

### At registration:
\`\`\`bash
drosera-operator register --eth-rpc-url <rpc> --eth-private-key <key> --root-operator-address 0x<root>
\`\`\`

### After registration:
\`\`\`bash
drosera-operator update-root-operator --eth-rpc-url <rpc> --eth-private-key <key> --operator-addresses 0x<op1>,0x<op2>,0x<op3> --root-operator-address 0x<root>
\`\`\``
  },

  {
    topic: "operator_vps",
    aliases: ["vps", "server", "systemd", "ubuntu", "linux server", "production", "ufw", "firewall", "run on server"],
    content: `# Run Operator on a VPS (systemd)

## 1. Install Dependencies
\`\`\`bash
sudo apt-get install -y curl clang libssl-dev tar ufw
\`\`\`

## 2. Install drosera-operator
\`\`\`bash
curl -L https://app.drosera.io/install | bash
source ~/.bashrc
droseraup
\`\`\`

## 3. Register
\`\`\`bash
drosera-operator register --eth-rpc-url https://ethereum-rpc.publicnode.com --eth-private-key <YOUR_KEY>
\`\`\`

## 4. Create Data Directory
\`\`\`bash
sudo mkdir -p /var/lib/drosera-data
sudo chown -R root:root /var/lib/drosera-data
sudo chmod -R 700 /var/lib/drosera-data
\`\`\`

## 5. Create systemd Service
Replace \`<<YOUR_ETH_PRIVATE_KEY_HERE>>\` and \`<<YOUR-PUBLIC-VPS-IP-ADDRESS>>\`:

\`\`\`bash
sudo tee /etc/systemd/system/drosera-operator.service > /dev/null <<EOF
[Unit]
Description=Service for Drosera Operator
Requires=network.target
After=network.target

[Service]
Type=simple
Restart=always

# Ethereum Mainnet
Environment="DRO__DROSERA_ADDRESS=0x01C344b8406c3237a6b9dbd06ef2832142866d87"
Environment="DRO__ETH__CHAIN_ID=1"
Environment="DRO__ETH__RPC_URL=https://ethereum-rpc.publicnode.com"
Environment="DRO__ETH__BACKUP_RPC_URL=https://1rpc.io/eth"

# Hoodi Testnet (uncomment to use instead)
# Environment="DRO__DROSERA_ADDRESS=0x91cB447BaFc6e0EA0F4Fe056F5a9b1F14bb06e5D"
# Environment="DRO__ETH__CHAIN_ID=560048"
# Environment="DRO__ETH__RPC_URL=https://ethereum-hoodi-rpc.publicnode.com"

Environment="DRO__DATA_DIR=/var/lib/.drosera/data"
Environment="DRO__LISTEN_ADDRESS=0.0.0.0"
Environment="DRO__ETH__PRIVATE_KEY=<<YOUR_ETH_PRIVATE_KEY_HERE>>"
Environment="DRO__NETWORK__P2P_PORT=31313"
Environment="DRO__NETWORK__EXTERNAL_P2P_ADDRESS=<<YOUR-PUBLIC-VPS-IP-ADDRESS>>"
Environment="DRO__SERVER__PORT=31314"
Environment="DRO__GAS_REIMBURSEMENT_REQUIRED=true"

ExecStart=/home/USER/.drosera/bin/drosera-operator node

[Install]
WantedBy=multi-user.target
EOF
\`\`\`

## 6. Start Service
\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl start drosera-operator.service
sudo systemctl enable drosera-operator.service
sudo systemctl status drosera-operator.service
sudo journalctl -u drosera-operator.service -f
\`\`\`

## 7. Configure Firewall
\`\`\`bash
sudo ufw allow ssh
sudo ufw allow 22
sudo ufw allow 31313/tcp
sudo ufw allow 31314/tcp
sudo ufw enable
\`\`\`

## 8. Verify Connectivity
From a different network:
\`\`\`bash
curl --location 'http://<YOUR_IP>:31314' \\
--header 'Content-Type: application/json' \\
--data '{"jsonrpc":"2.0","method":"drosera_healthCheck","params":[],"id":1}'
\`\`\`

> NOTE: \`WARN Failed to gossip message: InsufficientPeers\` can be safely ignored.`
  },

  {
    topic: "operator_docker",
    aliases: ["docker", "docker compose", "container", "docker operator", "run docker"],
    content: `# Run Operator with Docker

## 1. Install Docker
Follow the official Docker installation guide for your OS.
\`\`\`bash
sudo usermod -aG docker $USER
newgrp docker
\`\`\`

## 2. Register
\`\`\`bash
export VERSION=v1.20.0
docker run ghcr.io/drosera-network/drosera-operator:\${VERSION} register \\
  --eth-rpc-url https://ethereum-rpc.publicnode.com \\
  --eth-private-key <<YOUR_KEY>>
\`\`\`

## 3. Create Data Directory
\`\`\`bash
sudo mkdir -p /var/lib/drosera-data
sudo chown -R root:root /var/lib/drosera-data
sudo chmod -R 700 /var/lib/drosera-data
\`\`\`

## 4. Create Docker Compose Files
\`\`\`bash
mkdir drosera-operator && cd drosera-operator

tee .env > /dev/null <<EOF
VERSION=v1.20.0
ETH_PRIVATE_KEY=<<YOUR_ETH_PRIVATE_KEY_HERE>>
VPS_PUBLIC_IP=<<YOUR_PUBLIC_VPS_IP_ADDRESS>>
DRO__NETWORK__P2P_PORT=31313
DRO__SERVER__PORT=31314
EOF

tee docker-compose.yml > /dev/null <<'EOF'
version: '3'
services:
  drosera-operator:
    image: ghcr.io/drosera-network/drosera-operator:\${VERSION}
    container_name: drosera-operator
    network_mode: host
    environment:
      # Ethereum Mainnet
      - DRO__DROSERA_ADDRESS=0x01C344b8406c3237a6b9dbd06ef2832142866d87
      - DRO__ETH__CHAIN_ID=1
      - DRO__ETH__RPC_URL=https://ethereum-rpc.publicnode.com
      - DRO__ETH__BACKUP_RPC_URL=https://1rpc.io/eth

      # Hoodi Testnet (uncomment to use)
      # - DRO__DROSERA_ADDRESS=0x91cB447BaFc6e0EA0F4Fe056F5a9b1F14bb06e5D
      # - DRO__ETH__CHAIN_ID=560048
      # - DRO__ETH__RPC_URL=https://ethereum-hoodi-rpc.publicnode.com

      - DRO__DATA_DIR=/data/.drosera/data
      - DRO__LISTEN_ADDRESS=0.0.0.0
      - DRO__DISABLE_DNR_CONFIRMATION=true
      - DRO__ETH__PRIVATE_KEY=\${ETH_PRIVATE_KEY}
      - DRO__NETWORK__P2P_PORT=\${DRO__NETWORK__P2P_PORT}
      - DRO__NETWORK__EXTERNAL_P2P_ADDRESS=\${VPS_PUBLIC_IP}
      - DRO__SERVER__PORT=\${DRO__SERVER__PORT}
      - DRO__GAS_REIMBURSEMENT_REQUIRED=true
    volumes:
      - /var/lib/drosera-data:/data
    command: ["node"]
    restart: always
EOF
\`\`\`

## 5. Start
\`\`\`bash
docker compose up -d
docker compose logs -f
\`\`\`

## Multiple Operators on One Machine
Each operator needs unique:
- \`DRO__NETWORK__P2P_PORT\`
- \`DRO__SERVER__PORT\`
- Unique volume mount path (e.g. \`/var/lib/drosera-data2:/data\`)

> Docker + ufw don't play well together. Use your cloud provider's network firewall instead.`
  },

  {
    topic: "operator_monitoring",
    aliases: ["monitoring", "metrics", "grafana", "prometheus", "opentelemetry", "otel", "logs", "observability"],
    content: `# Operator Monitoring

The Operator Node exports OpenTelemetry metrics, logs, and traces.

## Configure Metrics Export
\`\`\`bash
drosera-operator node \\
  --otel-export-endpoint <endpoint> \\
  --otel-export-metadata <metadata> \\
  --otel-resource-attributes <attributes>
\`\`\`

## Available Metrics
- **drosera_process_cpu_usage** — CPU usage
- **drosera_process_disk_space_usage** — Disk usage
- **drosera_process_memory_usage** — Memory usage
- **total_memory** — Total system memory
- **execute_trap_duration** — Time to execute a trap
- **attestation_consensus_duration** — Time to reach consensus
- **connected_peer_count** — Peers sending messages
- **expected_peer_count** — Expected peer count
- **eth_balance** — Operator ETH balance

## Resource Attribute Labels
\`\`\`bash
drosera-operator node --otel-resource-attributes \\
  "operator_address=0x530719E...,operator_name=cobra"
\`\`\`

## Redirect Logs (prevent disk fill)
\`\`\`bash
drosera-operator node --otel-export-endpoint <endpoint> --log-output stdout > /dev/null
\`\`\`

## Monitoring Stack
Full Grafana + Prometheus + Loki + Tempo stack:
https://github.com/drosera-network/operator-monitoring-stack

Run with Docker Compose — includes dashboards out of the box.`
  }
];

// ── Query function ─────────────────────────────────────────────────────────

export function queryDocs(topic: string): DocEntry | null {
  const t = topic.toLowerCase().trim();

  // Exact topic match first
  const exact = DOCS.find((d) => d.topic === t.replace(/\s+/g, "_"));
  if (exact) return exact;

  // Alias match
  const alias = DOCS.find((d) => d.aliases.some((a) => t.includes(a) || a.includes(t)));
  if (alias) return alias;

  return null;
}

export function listTopics(): string[] {
  return DOCS.map((d) => `${d.topic} — ${d.aliases.slice(0, 3).join(", ")}`);
}