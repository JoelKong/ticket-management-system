// MongoDB initialization script
db = db.getSiblingDB("ticket_management_system");

// Create user for the application
db.createUser({
  user: "mongodb",
  pwd: "mongodb123",
  roles: [
    {
      role: "readWrite",
      db: "ticket_management_system",
    },
  ],
});

// Create collections
db.createCollection("users");
db.createCollection("concerts");
db.createCollection("seats");
db.createCollection("bookings");

print("MongoDB initialization completed successfully!");
