from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.db.seed import seed_admin_user

# Global MongoDB client
client: AsyncIOMotorClient = None
database = None


async def connect_to_mongo():
    """Initialize MongoDB connection with retry logic."""
    global client, database
    import asyncio
    
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    
    # Wait for MongoDB to be ready (with retries)
    max_retries = 5  # Reduced for local dev without mongo
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
            break
        except Exception as exc:
            print(f"Attempt {attempt + 1}: Failed to connect to MongoDB: {exc}")
            if attempt == max_retries - 1:
                print("WARNING: Could not connect to MongoDB. Database features will not work.")
            else:
                await asyncio.sleep(1)


async def create_indexes():
    """Create database indexes for optimal query performance."""
    if database is None:
        return
    
    # Users collection: drop old indexes and create mobile_phone index (unique)
    users_collection = database.users
    # Drop old indexes that might exist from previous schema
    try:
        await users_collection.drop_index("email_1")  # Old email index
    except Exception:
        pass  # Index doesn't exist, that's fine
    try:
        await users_collection.drop_index("username_1")  # Old username index
    except Exception:
        pass  # Index doesn't exist, that's fine
    # Create new mobile_phone index
    await users_collection.create_index("mobile_phone", unique=True)
    
    # Students collection: drop old mobile_phone index and create user_id index (unique)
    students_collection = database.students
    # Drop old mobile_phone index (moved to users collection)
    try:
        await students_collection.drop_index("mobile_phone_1")
    except Exception:
        pass  # Index doesn't exist, that's fine
    # Create user_id index
    await students_collection.create_index("user_id", unique=True)
    
    # Teachers collection: user_id index (unique)
    teachers_collection = database.teachers
    await teachers_collection.create_index("user_id", unique=True)
    
    # Question collection: composite index on (exam_id, number)
    questions_collection = database.questions
    await questions_collection.create_index([("exam_id", 1), ("number", 1)], unique=True)
    
    # ExamSessions collection: session_token index (unique) and student_id index
    exam_sessions_collection = database.exam_sessions
    await exam_sessions_collection.create_index("session_token", unique=True)
    await exam_sessions_collection.create_index("student_id")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
