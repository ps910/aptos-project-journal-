const a = require('aptos');
console.log(Object.keys(a));
console.log(a.AptosClient ? 'AptosClient OK' : 'AptosClient MISSING');
console.log(a.FaucetClient ? 'FaucetClient OK' : 'FaucetClient MISSING');
console.log(a.AptosAccount ? 'AptosAccount OK' : 'AptosAccount MISSING');
