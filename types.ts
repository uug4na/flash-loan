export enum SimulationStep {
  IDLE = 0,
  FLASH_LOAN = 1,
  ORACLE_MANIPULATION = 2,
  DEPOSIT_COLLATERAL = 3,
  MAX_BORROW = 4,
  REPAY_LOAN = 5,
  PROFIT = 6
}

export interface Token {
  symbol: string;
  name: string;
  price: number;
}

export interface WalletState {
  usdc: number;
  gemToken: number; // The target token
  debt: number;
}

export interface ProtocolState {
  dexPrice: number;
  poolLiquidityUsdc: number;
  poolLiquidityGem: number;
  oraclePrice: number;
  collateralFactor: number; // LTV
}

export interface LogEntry {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface StepLog {
  title: string;
  description: string;
  formula?: string;
  mechanics: LogEntry[];
  vulnerabilityNote?: string;
}
