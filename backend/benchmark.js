const http = require('http');

const runBenchmark = async (path, iterations) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await new Promise((resolve) => {
      http.get(`http://localhost:3001${path}`, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
    });
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1000000); // ms
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);
  
  console.log(`Endpoint: ${path} | Requests: ${iterations}`);
  console.log(`Avg: ${avg.toFixed(2)}ms | Min: ${min.toFixed(2)}ms | Max: ${max.toFixed(2)}ms`);
};

(async () => {
  console.log('--- Backend API Benchmark ---');
  await runBenchmark('/api/workshops', 50);
  await runBenchmark('/api/parts', 50);
  console.log('-----------------------------');
})();
