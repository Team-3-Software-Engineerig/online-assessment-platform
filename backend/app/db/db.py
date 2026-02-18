from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Global MongoDB client
client: AsyncIOMotorClient = None
database = None


async def connect_to_mongo():
    """Initialize MongoDB connection with retry logic."""
    global client, database
    import asyncio
    
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    
    # Wait for MongoDB to be ready (with retries)
    max_retries = 30
    for attempt in range(max_retries):
        try:
            # Test connection
            await client.admin.command('ping')
            break
        except Exception as e:
            if attempt == max_retries - 1:
                raise ConnectionError(f"Failed to connect to MongoDB after {max_retries} attempts: {e}")
            await asyncio.sleep(1)
    
    database = client.get_database(settings.MONGO_DATABASE)
    # Create indexes on first connection
    await create_indexes()


async def create_indexes():
    """Create database indexes for optimal query performance."""
    if database is None:
        return
    
    # Users collection: email index (unique)
    users_collection = database.users
    await users_collection.create_index("email", unique=True)
    
    # Students collection: user_id index (unique)
    students_collection = database.students
    await students_collection.create_index("user_id", unique=True)
    
    # Teachers collection: user_id index (unique)
    teachers_collection = database.teachers
    await teachers_collection.create_index("user_id", unique=True)
    
    # Question collection: composite index on (exam_id, number)
    questions_collection = database.questions
    await questions_collection.create_index([("exam_id", 1), ("number", 1)], unique=True)


async def close_mongo_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
