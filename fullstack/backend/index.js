require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { AptosClient, AptosAccount, TxnBuilderTypes, BCS, FaucetClient } = require('aptos');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const USE_APTOS = (process.env.USE_APTOS || 'false').toLowerCase() === 'true';
const APTOS_MODULE_ADDR = process.env.APTOS_MODULE_ADDR || '';

// Simple in-memory mock storage as fallback
const mock = {
  journalOwner: process.env.JOURNAL_OWNER_ADDRESS || '0x1',
  ideas: [],
  nextIdeaId: 1,
};

const indexer = require('./indexer');

// Helper to map idea shape
function ideaToDTO(idea) {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    author: idea.author,
    votes: idea.votes,
    timestamp: idea.timestamp,
  };
}

// If USE_APTOS is enabled, wire up Aptos client and helper functions
let aptosClient = null;
let aptosAccount = null;
if (USE_APTOS) {
  const nodeUrl = process.env.APTOS_NODE_URL;
  aptosClient = new AptosClient(nodeUrl);
  if (process.env.APTOS_PRIVATE_KEY) {
    // private key expected as hex string
    const privateKeyHex = process.env.APTOS_PRIVATE_KEY.replace(/^0x/, '');
    const acct = AptosAccount.fromPrivateKeyHex(privateKeyHex);
    aptosAccount = acct;
  }
}

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true, aptos: USE_APTOS }));

// Get all ideas (mock)
app.get('/api/ideas', (req, res) => {
  if (!USE_APTOS) {
    // return persisted ideas
    indexer.getIdeas().then(rows => res.json(rows)).catch(e => res.status(500).json({ error: String(e) }));
    return;
  }
  return res.status(501).json({ error: 'Aptos mode read not implemented in example' });
});

// Submit idea
app.post('/api/ideas', async (req, res) => {
  const { title, description, journalOwner } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title and description required' });

  if (!USE_APTOS) {
    const newIdea = {
      id: mock.nextIdeaId++,
      title,
      description,
      author: '0x_mok',
      votes: 0,
      timestamp: Math.floor(Date.now() / 1000),
    };
    mock.ideas.push(newIdea);
    // persist
    try {
      await indexer.addIdea(newIdea);
    } catch (e) {
      console.error('DB addIdea failed', e);
    }
    return res.json(ideaToDTO(newIdea));
  }

  // Aptos integration would build and submit a transaction calling your Move entry `submit_idea`.
  if (!APTOS_MODULE_ADDR) return res.status(400).json({ error: 'APTOS_MODULE_ADDR not set in .env' });

  if (!aptosAccount) return res.status(400).json({ error: 'APTOS_PRIVATE_KEY not configured for server signing' });

  try {
    const journalOwnerAddr = journalOwner || process.env.JOURNAL_OWNER_ADDRESS;
    const entryFunctionPayload = {
      type: 'entry_function_payload',
      function: `${APTOS_MODULE_ADDR}::MyModule::OpenJournal::submit_idea`,
      type_arguments: [],
      arguments: [journalOwnerAddr, title, description],
    };

    const rawTxn = await aptosClient.generateTransaction(aptosAccount.address(), entryFunctionPayload);
    const signedTxn = aptosAccount.signTransaction(rawTxn);
    const txResponse = await aptosClient.submitTransaction(signedTxn);
    await aptosClient.waitForTransaction(txResponse.hash);

    // Persist a light copy locally (id tracking is simplified)
    const newIdea = {
      id: mock.nextIdeaId++,
      title,
      description,
      author: aptosAccount.address().hex(),
      votes: 0,
      timestamp: Math.floor(Date.now() / 1000),
    };
    try { await indexer.addIdea(newIdea); } catch (e) { console.error('DB addIdea after aptos tx failed', e) }

    return res.json({ ok: true, hash: txResponse.hash });
  } catch (e) {
    console.error('Aptos submit error', e);
    return res.status(500).json({ error: 'Aptos submit failed', detail: String(e) });
  }
});

// Vote for idea (mock)
app.post('/api/ideas/:id/vote', async (req, res) => {
  const id = Number(req.params.id);
  if (!USE_APTOS) {
    const idea = mock.ideas.find(i => i.id === id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    idea.votes = (idea.votes || 0) + 1;
    try { await indexer.incrementVote(id); } catch (e) { console.error('DB incrementVote failed', e) }
    return res.json(ideaToDTO(idea));
  }
  if (!APTOS_MODULE_ADDR) return res.status(400).json({ error: 'APTOS_MODULE_ADDR not set in .env' });

  try {
    const journalOwnerAddr = process.env.JOURNAL_OWNER_ADDRESS;
    const entryFunctionPayload = {
      type: 'entry_function_payload',
      function: `${APTOS_MODULE_ADDR}::MyModule::OpenJournal::vote_for_idea`,
      type_arguments: [],
      arguments: [journalOwnerAddr, id],
    };

    const rawTxn = await aptosClient.generateTransaction(aptosAccount.address(), entryFunctionPayload);
    const signedTxn = aptosAccount.signTransaction(rawTxn);
    const txResponse = await aptosClient.submitTransaction(signedTxn);
    await aptosClient.waitForTransaction(txResponse.hash);

    return res.json({ ok: true, hash: txResponse.hash });
  } catch (e) {
    console.error('Aptos vote error', e);
    return res.status(500).json({ error: 'Aptos vote failed', detail: String(e) });
  }
});

// GET idea by id via on-chain resource (best-effort - requires module published with expected Journal resource)
app.get('/api/aptos/ideas/:id', async (req, res) => {
  if (!USE_APTOS) return res.status(400).json({ error: 'Not in Aptos mode' });
  const id = Number(req.params.id);
  try {
    const journalOwnerAddr = process.env.JOURNAL_OWNER_ADDRESS;
    // Reading resources requires knowing the resource type path; here we attempt to read the Journal resource under the module address
    const resourceType = `${APTOS_MODULE_ADDR}::MyModule::OpenJournal::Journal`;
    const accountResources = await aptosClient.getAccountResources(journalOwnerAddr);
    const journalRes = accountResources.find(r => r.type === resourceType);
    if (!journalRes) return res.status(404).json({ error: 'Journal resource not found on-chain' });
    // journalRes.data.ideas may be serialized differently; for this scaffold we return the raw resource
    return res.json({ resource: journalRes });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// Get idea
app.get('/api/ideas/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!USE_APTOS) {
    const idea = mock.ideas.find(i => i.id === id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    return res.json(ideaToDTO(idea));
  }
  res.status(501).json({ error: 'Aptos get idea not implemented in scaffold' });
});

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT} (APTOS=${USE_APTOS})`));
