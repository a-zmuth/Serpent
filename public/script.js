import {
  HexString,
  SupraAccount,
  SupraClient,
  BCS,
  TxnBuilderTypes,
} from "supra-l1-sdk";

// Add custom TransactionResult interface
interface TransactionResult {
  success: boolean;
  txHash: string;
  gasUsed?: bigint;
}

interface StarkeyWallet {
  connect: () => Promise<{ accounts: string[] }>;
  signTransaction: (tx: Uint8Array) => Promise<Uint8Array>;
  onAccountChanged: (callback: (address: string) => void) => void;
}

class SupraHandler {
  private readonly client: SupraClient;
  private currentAddress: HexString | null = null;

  private constructor(client: SupraClient) {
    this.client = client;
  }

  static async create(rpcUrl: string): Promise<SupraHandler> {
    const client = await SupraClient.init(rpcUrl);
    return new SupraHandler(client);
  }

  async connectWallet(connectCallback: () => Promise<string>): Promise<HexString> {
    try {
      const address = await connectCallback();
      const hexAddress = new HexString(address);
      
      if (!(await this.client.isAccountExists(hexAddress))) {
        throw new Error('Account not initialized on-chain');
      }

      this.currentAddress = hexAddress;
      return hexAddress;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  async getBalance(address: HexString): Promise<bigint> {
    return this.client.getAccountSupraCoinBalance(address);
  }

  async prepareTransaction(
    receiver: HexString,
    amount: bigint
  ): Promise<Uint8Array> {
    if (!this.currentAddress) {
      throw new Error('No connected account');
    }

    const senderInfo = await this.client.getAccountInfo(this.currentAddress);
    
    const rawTx = await this.client.createRawTxObject(
      this.currentAddress,
      senderInfo.sequence_number,
      "0000000000000000000000000000000000000000000000000000000000000001",
      "supra_account",
      "transfer",
      [],
      [receiver.toUint8Array(), BCS.bcsSerializeUint64(amount)]
    );

    // Serialize the transaction
    const serializer = new BCS.Serializer();
    rawTx.serialize(serializer);
    return serializer.getBytes();
  }

  async submitTransaction(signedTx: Uint8Array): Promise<TransactionResult> {
    if (!this.currentAddress) {
      throw new Error('No account connected');
    }

    const result = await this.client.sendTxUsingSerializedRawTransaction(
      new SupraAccount(Buffer.from("dummy_key")), // Shouldn't be needed with proper wallet signing
      signedTx,
      {
        // Correct transaction options
        enableWaitForTransaction: true,
        enableTransactionSimulation: true
      }
    );

    return {
      success: result.Tx_Status === "Executed",
      txHash: result.txHash.toString(),
      gasUsed: result.gas_Used
    };
  }
}

// Frontend Integration
let supraHandler: SupraHandler | null = null;
let userAddress: HexString | null = null;

declare global {
  interface Window {
    starkey: StarkeyWallet;
  }
}

const connectWalletBtn = document.getElementById('connectWalletBtn') as HTMLButtonElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const balanceDisplay = document.getElementById('balanceDisplay') as HTMLDivElement;

connectWalletBtn.onclick = async (): Promise<void> => {
  try {
    supraHandler = await SupraHandler.create("https://rpc-testnet.supra.com/");
    
    userAddress = await supraHandler.connectWallet(async () => {
      const { accounts } = await window.starkey.connect();
      return accounts[0];
    });
    
    updateUI();
    logBalance();
  } catch (error) {
    console.error('Connection flow failed:', error);
    alert('Wallet connection failed. Please try again.');
  }
};

startBtn.onclick = async (): Promise<void> => {
  if (!userAddress || !supraHandler) return;

  const score = calculateGameScore();
  const receiver = new HexString("0xb8922417130785087f9c7926e76542531b703693fdc74c9386b65cf4427f4e80");
  
  try {
    const rawTx = await supraHandler.prepareTransaction(receiver, BigInt(score));
    const signedTx = await window.starkey.signTransaction(rawTx);
    const result = await supraHandler.submitTransaction(signedTx);
    
    if (result.success) {
      window.open('../game-play/game.html', '_blank');
    }
  } catch (error) {
    console.error('Transaction flow failed:', error);
    alert('Transaction failed. Please check your balance and try again.');
  }
};

async function logBalance(): Promise<void> {
  if (userAddress && supraHandler) {
    try {
      const balance = await supraHandler.getBalance(userAddress);
      balanceDisplay.textContent = `Balance: ${balance.toString()} SUPRA`;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }
}

function updateUI(): void {
  startBtn.disabled = !userAddress;
  startBtn.textContent = userAddress ? "Start Game" : "Connect Wallet First";
}

function calculateGameScore(): number {
  return Math.floor(Math.random() * 1000);
}

if (window.starkey) {
  window.starkey.onAccountChanged((newAddress: string) => {
    if (supraHandler) {
      userAddress = new HexString(newAddress);
      logBalance();
    }
  });
}