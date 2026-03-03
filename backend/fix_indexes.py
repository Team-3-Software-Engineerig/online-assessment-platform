"""
Script to fix database indexes after schema changes.
Run this once to clean up old indexes.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def fix_indexes():
    """Drop old indexes and create new ones."""
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    database = client.get_database(settings.MONGO_DATABASE)
    
    users_collection = database.users
    
    # List all indexes
    indexes = await users_collection.list_indexes().to_list(length=100)
    print("Current indexes on users collection:")
    for idx in indexes:
        print(f"  - {idx.get('name')}: {idx.get('key')}")
    
    # Drop old indexes
    old_indexes = ["email_1", "username_1", "username"]
    for idx_name in old_indexes:
        try:
            await users_collection.drop_index(idx_name)
            print(f"✓ Dropped index: {idx_name}")
        except Exception as exc:
            print(f"✗ Could not drop {idx_name}: {exc}")
    
    # Create new index
    try:
        await users_collection.create_index("mobile_phone", unique=True)
        print("✓ Created index: mobile_phone_1")
    except Exception as exc:
        print(f"✗ Could not create mobile_phone index: {exc}")
    
    # Students collection - drop old mobile_phone index
    students_collection = database.students
    try:
        await students_collection.drop_index("mobile_phone_1")
        print("✓ Dropped students.mobile_phone_1 index")
    except Exception as exc:
        print(f"✗ Could not drop students.mobile_phone_1: {exc}")
    
    client.close()
    print("\nDone! You can now restart your application.")

if __name__ == "__main__":
    asyncio.run(fix_indexes())

