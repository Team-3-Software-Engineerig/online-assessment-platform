from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.db.seed import seed_admin_user
import os
import pickle
import asyncio

# Global MongoDB client
client: AsyncIOMotorClient = None
database = None

# Path for mock data persistence
MOCK_DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "mock_db.pkl"))


async def connect_to_mongo():
    """Initialize MongoDB connection with retry logic."""
    global client, database
    
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1000)
    
    # Wait for MongoDB to be ready (with retries)
    # Give MongoDB enough time to be ready in containerized deploys.
    max_retries = 15
    for attempt in range(max_retries):
        try:
            # Test connection
            await client.admin.command('ping')
            database = client.get_database(settings.MONGO_DATABASE)
            # Create indexes on first connection
            await create_indexes()
            # Seed admin user
            await seed_admin_user(database)
            print("Successfully connected to MongoDB")
            return
        except Exception as exc:
            print(f"Attempt {attempt + 1}: Failed to connect to MongoDB: {exc}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2)
                
    # Fallback to Mock
    print(f"WARNING: Falling back to in-memory Mock MongoDB (mongomock). Persistence active at {MOCK_DB_FILE}")
    from mongomock_motor import AsyncMongoMockClient
    mock_client = AsyncMongoMockClient()
    database = mock_client.get_database(settings.MONGO_DATABASE)
    
    # Try to load existing data
    if os.path.exists(MOCK_DB_FILE):
        try:
            with open(MOCK_DB_FILE, "rb") as f:
                db_state = pickle.load(f)
                
            for coll_name, docs in db_state.items():
                if docs:
                    # Clear collection first
                    await database[coll_name].delete_many({})
                    # Insert back
                    await database[coll_name].insert_many(docs)
            print(f"Successfully restored database from {MOCK_DB_FILE}")
        except Exception as e:
            print(f"Note: Could not load mock data (this is normal on first run): {e}")
            
    # Still seed mock admin if it doesn't exist
    await seed_admin_user(database)
    
    # Setup periodic save
    asyncio.create_task(periodic_save())


async def periodic_save():
    """Periodically save the mock database to disk."""
    await save_mock_db() # Save once immediately
    while True:
        await asyncio.sleep(5) # Save every 5 seconds
        try:
            await save_mock_db()
        except Exception:
            pass


async def save_mock_db():
    try:
        if database is not None:
            # We want to save our data to the pickle file if using mock
            # Iterate through all collections and dump their data
            collections = await database.list_collection_names()
            db_state = {}
            for coll_name in collections:
                # Get all documents
                docs = await database[coll_name].find().to_list(length=5000)
                if docs:
                    db_state[coll_name] = docs
            
            if db_state:
                os.makedirs(os.path.dirname(MOCK_DB_FILE), exist_ok=True)
                with open(MOCK_DB_FILE, "wb") as f:
                    pickle.dump(db_state, f)
                print(f"DATABASE PERSISTED: Saved {len(db_state)} collections to {MOCK_DB_FILE}")
    except Exception as e:
        print(f"Note: Could not save mock data: {e}")


async def create_indexes():
    """Create database indexes."""
    if database is None:
        return
    
    users_collection = database.users
    try:
        await users_collection.drop_index("email_1")
    except Exception:
        pass
    try:
        await users_collection.drop_index("username_1")
    except Exception:
        pass
    await users_collection.create_index("mobile_phone", unique=True)
    
    students_collection = database.students
    try:
        await students_collection.drop_index("mobile_phone_1")
    except Exception:
        pass
    await students_collection.create_index("user_id", unique=True)
    
    teachers_collection = database.teachers
    await teachers_collection.create_index("user_id", unique=True)
    
    questions_collection = database.questions
    await questions_collection.create_index([("exam_id", 1), ("number", 1)], unique=True)
    
    exam_sessions_collection = database.exam_sessions
    await exam_sessions_collection.create_index("session_token", unique=True)
    await exam_sessions_collection.create_index("student_id")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
