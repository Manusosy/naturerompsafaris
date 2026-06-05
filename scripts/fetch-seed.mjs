fetch('http://localhost:3000/api/seed?secret=DevelopmentDraftSeed2026')
  .then(res => res.json())
  .then(data => console.log('Seed response:', data))
  .catch(err => console.error('Fetch error:', err));
