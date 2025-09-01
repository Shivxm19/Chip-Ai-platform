import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import json

# Your MongoDB connection string
MONGO_URI = "mongodb://siliconai-19:%2A%2AShivam%4019@ac-ghkrhxz-shard-00-00.wqbucxq.mongodb.net:27017,ac-ghkrhxz-shard-00-01.wqbucxq.mongodb.net:27017,ac-ghkrhxz-shard-00-02.wqbucxq.mongodb.net:27017/admin?replicaSet=atlas-w18o1e-shard-0&ssl=true&authSource=admin"
# The database name within your MongoDB Atlas cluster
MONGO_DB_NAME = "eda-user-db"  # Replace with your actual database name

# The user data to insert, including the Firebase UID you provided
user_document = {
  "firebaseUid": "Y5kQuhSyWAg8EbnFECAwwXsrYN22",
  "email": "shivxm.19.com",
  "isAdmin": True,
  "membership": "premium",
  "createdAt": datetime.utcnow(),
  "updatedAt": datetime.utcnow()
}

async def insert_user_into_db():
    """
    Connects to MongoDB and inserts a single user document.
    """
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.eda_backend # Replace 'eda_backend' with your database name
    users_collection = db.users

    try:
        # Check if a user with this UID already exists
        existing_user = await users_collection.find_one({"firebaseUid": user_document["firebaseUid"]})
        if existing_user:
            print(f"User with UID {user_document['firebaseUid']} already exists. Skipping insertion.")
        else:
            # Insert the new user document
            result = await users_collection.insert_one(user_document)
            print(f"Successfully inserted user with ID: {result.inserted_id}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Close the database connection
        client.close()

if __name__ == "__main__":
    asyncio.run(insert_user_into_db())