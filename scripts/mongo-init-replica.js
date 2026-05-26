// Initialize MongoDB replica set on first startup
try {
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongodb:27017', priority: 1 }],
  });
  print('Replica set initiated');
} catch (e) {
  print('Replica set already initiated or error:', e.message);
}
