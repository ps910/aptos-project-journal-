const axios = require('axios');

async function run() {
  try {
    const base = 'http://localhost:4000/api';
    console.log('Health ->', (await axios.get(base + '/health')).data);
    console.log('Create idea ->', (await axios.post(base + '/ideas', { title: 'Test', description: 'Desc' })).data);
    console.log('List ideas ->', (await axios.get(base + '/ideas')).data);
    console.log('Vote ->', (await axios.post(base + '/ideas/1/vote')).data);
    console.log('Get idea ->', (await axios.get(base + '/ideas/1')).data);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}

run();
