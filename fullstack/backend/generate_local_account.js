const { AptosAccount } = require('aptos');
const fs = require('fs');
const path = require('path');

const account = new AptosAccount();
const priv = account.toPrivateKeyObject().privateKeyHex;
const addr = account.address().hex();
console.log('Generated local account:', addr);
console.log('Private key (hex):', priv);

const envPath = path.join(__dirname, '.env');
const envContent = `USE_APTOS=false\nAPTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com\nAPTOS_PRIVATE_KEY=${priv}\nJOURNAL_OWNER_ADDRESS=${addr}\n`;
fs.writeFileSync(envPath, envContent);
console.log('Wrote .env to', envPath);
