fetch('http://localhost:3000/api/v1/leave/seed')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
