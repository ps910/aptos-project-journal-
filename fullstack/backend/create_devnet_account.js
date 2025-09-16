const { AptosClient, FaucetClient, AptosAccount } = require('aptos');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
    const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';

    const client = new AptosClient(NODE_URL);
    const faucet = new FaucetClient(NODE_URL, FAUCET_URL);

    const account = new AptosAccount();
    console.log('Generated account address:', account.address().hex());
    console.log('Private key (hex):', account.toPrivateKeyObject().privateKeyHex);

    console.log('Requesting funds from faucet...');
    await faucet.fundAccount(account.address(), 100_000_000); // 100 APT (in Octas)
    console.log('Faucet funding requested. Waiting for balance...');

    // Wait a little and then check balance
    await new Promise(r => setTimeout(r, 2000));
    const resources = await client.getAccountResources(account.address());
    console.log('Account resources count:', resources.length);

    // Update .env
    const envPath = path.join(__dirname, '.env');
    const envContent = `USE_APTOS=true\nAPTOS_NODE_URL=${NODE_URL}\nAPTOS_PRIVATE_KEY=${account.toPrivateKeyObject().privateKeyHex}\nJOURNAL_OWNER_ADDRESS=${account.address().hex()}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('Wrote .env with new account credentials to', envPath);
  } catch (e) {
    console.error('Failed to create/fund devnet account:', e);
    process.exit(1);
  }
}

run();
