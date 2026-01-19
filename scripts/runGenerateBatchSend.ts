import fs from 'fs';
import path from 'path';

type MigrationTransaction = {
  contractInputsValues?: {
    tos?: unknown;
    amounts?: unknown;
  } | null;
};

type MigrationFile = {
  chainId?: string;
  meta?: {
    name?: string;
    description?: string;
    txBuilderVersion?: string;
    createdFromSafeAddress?: string;
    createdFromOwnerAddress?: string;
    checksum?: string;
  };
  transactions?: MigrationTransaction[];
};

const BASE_CHAIN_ID = '8453';
const BASE_SAFE_ADDRESS = '0xA01984b6e00586CA61269eb966E588466c112F5b';
const RMRK_TOKEN_ADDRESS = '0x524d524B4c9366be706D3A90dcf70076ca037aE3';
const TX_BUILDER_VERSION = '1.16.1';
const FEE_PERCENT = 5n;
const LEGACY_DECIMALS = 10n;
const NEW_DECIMALS = 18n;
const DECIMAL_SCALE = 10n ** (NEW_DECIMALS - LEGACY_DECIMALS);

function parseBatchArg(argv: string[]): number {
  const batchArg = argv[2];
  if (!batchArg) {
    throw new Error(
      'Missing batch number. Usage: yarn ts-node scripts/runGenerateBatchSend.ts <batchNumber>',
    );
  }
  const batch = Number(batchArg);
  if (!Number.isInteger(batch) || batch < 0) {
    throw new Error(`Invalid batch number "${batchArg}". Must be a non-negative integer.`);
  }
  return batch;
}

function parseAddressList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry));
      }
    } catch {
      // Fall back to comma-separated parsing.
    }
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  throw new Error('Invalid "tos" value; expected a JSON array or comma-separated string.');
}

function parseAmountList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    const matches = trimmed.match(/\d+/g);
    return matches ? matches : [];
  }
  throw new Error('Invalid "amounts" value; expected a JSON array or comma-separated string.');
}

function applyFee(amount: bigint): bigint {
  return (amount * (100n - FEE_PERCENT)) / 100n;
}

function scaleToNewDecimals(amount: bigint): bigint {
  return amount * DECIMAL_SCALE;
}

async function main() {
  const batch = parseBatchArg(process.argv);
  const batchLabel = batch.toString();

  const migrationsDir = path.resolve(__dirname, '..', 'migrations');
  const inputPath = path.join(migrationsDir, `${batchLabel}.json`);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Migration file not found at ${inputPath}`);
  }

  const migration = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as MigrationFile;
  const transaction = migration.transactions?.find(
    (entry) => entry.contractInputsValues?.tos && entry.contractInputsValues?.amounts,
  );
  if (!transaction || !transaction.contractInputsValues) {
    throw new Error('No transaction with "tos" and "amounts" found in migration file.');
  }

  const tos = parseAddressList(transaction.contractInputsValues.tos);
  const rawAmounts = parseAmountList(transaction.contractInputsValues.amounts);
  if (tos.length !== rawAmounts.length) {
    throw new Error(
      `Mismatched lengths: ${tos.length} recipients, ${rawAmounts.length} amounts.`,
    );
  }

  const amounts = rawAmounts.map((amount, index) => {
    if (!/^\d+$/.test(amount)) {
      throw new Error(`Invalid amount at index ${index}: "${amount}"`);
    }
    return BigInt(amount);
  });
  const scaledAmounts = amounts.map((amount) => scaleToNewDecimals(amount));
  const reducedAmounts = scaledAmounts.map((amount) => applyFee(amount));

  if (migration.chainId && migration.chainId !== BASE_CHAIN_ID) {
    console.warn(`Input chainId ${migration.chainId} ignored; using Base (${BASE_CHAIN_ID}).`);
  }
  const outputChainId = BASE_CHAIN_ID;
  const outputDir = path.resolve(__dirname, '..', 'migration-send');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const transactions = tos.map((recipient, index) => ({
    to: RMRK_TOKEN_ADDRESS,
    value: '0',
    data: null,
    contractMethod: {
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'value', type: 'uint256' },
      ],
      name: 'transfer',
      payable: false,
    },
    contractInputsValues: {
      to: recipient,
      value: reducedAmounts[index].toString(),
    },
  }));

  const output = {
    version: '1.0',
    chainId: outputChainId,
    createdAt: Math.floor(Date.now() / 1000),
    meta: {
      name: `RMRK Batch Send ${batchLabel}`,
      description: `Batch ${batchLabel} transfers after a 5% fee`,
      txBuilderVersion: migration.meta?.txBuilderVersion ?? TX_BUILDER_VERSION,
      createdFromSafeAddress: BASE_SAFE_ADDRESS,
      createdFromOwnerAddress: '',
      checksum: migration.meta?.checksum ?? '',
    },
    transactions,
  };

  const outputPath = path.join(outputDir, `${batchLabel}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  const totalLegacy = amounts.reduce((sum, amount) => sum + amount, 0n);
  const totalScaled = scaledAmounts.reduce((sum, amount) => sum + amount, 0n);
  const totalReduced = reducedAmounts.reduce((sum, amount) => sum + amount, 0n);
  console.log(`Loaded ${tos.length} recipients from ${inputPath}`);
  console.log(`Total legacy (10 decimals): ${totalLegacy.toString()}`);
  console.log(`Total scaled (18 decimals): ${totalScaled.toString()}`);
  console.log(`Total after fee (18 decimals): ${totalReduced.toString()}`);
  console.log(`Wrote batch send file to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
