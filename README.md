# Token Migration Steps: Moonriver → Moonbeam

## 0) Setup (first time only)

1. Pull the `rmrk-token-migration` repo:  
   https://github.com/rmrk-team/rmrk-token-migration

2. Install dependencies.

3. Copy `.env.example` to `.env`.
    - You can leave the example value for `PRIVATE_KEY`.
    - You won’t be signing any transactions (TXs) from here.

4. Compile:
   ```bash
   yarn hardhat compile
   ```

---

## 1) Generate a JSON file with the transaction batch for the **Moonriver Migrator**

From the root of the `rmrk-token-migration` repo, run:
```bash
yarn hardhat getTxToStartMoonriverMigration --network moonriver
```

This will:
- Display the `CURRENT_BATCH_NUMBER` in the terminal.
- Generate a JSON file at:
  `migrations-start/{CURRENT_BATCH_NUMBER_HERE}.json`

You can import this JSON into the Safe Apps **Transaction Builder** to initiate the call.

### Expected batch contents (3 transactions)

1. `finishBatch`  
   Finishes the previous batch, which burns the old RMRK tokens.

2. `startMigratingBatch`  
   Starts migrating the current batch.

3. `startNextBatch`  
   Starts the next batch.

---

## 2) Run the batch of transactions from the **Moonriver Migrator**

1. Go to Safe Apps **Transaction Builder** on **Moonriver**.
2. Import the JSON file from Step 1.
3. Start the call.

### Signers need to check

https://multisig.moonbeam.network/apps/open?safe=mbeam:0x85Ab410A50A3D85f1a26d9e4eFCaa520a39B9CD6&appUrl=https%3A%2F%2Fapps.safe.protofire.io%2Ftx-builder

---

## 3) Get holders and amounts for the migrating batch

After the call from Step 2 is executed, you can create a JSON file for the **Moonbeam** batch call.

From the `rmrk-token-migration` repo, run:
```bash
yarn hardhat getMigrationForBatch {CURRENT_BATCH_NUMBER} --network moonriver
```

This will generate a JSON file at:
`migrations/{CURRENT_BATCH_NUMBER}.json`

---

## 4) Run the migration on **Moonbeam**

1. Go to Safe Apps **Transaction Builder** on **Moonbeam**.
2. Import the JSON file from Step 3.
3. Start the call.

### Expected batch contents (1 transaction)

- `migrate`  
  Mints new RMRK tokens to all addresses in the submitted batch.

You will see two list values in `contractInputsValues`:
- `tos` (list of recipients)
- `amounts` (token amounts to distribute, in the same order as `tos`)

### Signers need to check

Repeat Step 3 on your local repository. The batch, `tos`, and accounts must match.

https://multisig.moonbeam.network/apps/open?safe=mbeam:0x85Ab410A50A3D85f1a26d9e4eFCaa520a39B9CD6&appUrl=https%3A%2F%2Fapps.safe.protofire.io%2Ftx-builder

### Execution notes

Using Multisig on Moonbeam, import the file from Step 3 and execute it. This calls:

`MoonbeamMigrator(0xf4B6FE71B6aa6f904864B4C95ECDBcc06CBec5d9).migrate(currentBatch, holders, amounts)`

### Post-migration

After announcing https://rmrk.app/migration, the process changes somewhat.

First, run migration start

```sh
yarn hardhat getTxToStartMoonriverMigration --network moonriver
```

Then, mint this resulting JSON via Moonriver multisig: 

https://multisig.moonbeam.network/home?safe=mriver:0x7e8421b873429eE58A06055E89CD0DBeF51784F0
