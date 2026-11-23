const ngrok = require('@ngrok/ngrok');

async function start() {
  try {
    const listener = await ngrok.forward({
      addr: 5000,
      authtoken: '3LBQlCyoWhpRSNPW2usddgqyhPr_2NKFawXCYJ3bgK9HaA2Ci',
    });
    console.log('PUBLIC_URL=' + listener.url());
  } catch (err) {
    console.error('Ngrok error:', err);
  }
}

start();
