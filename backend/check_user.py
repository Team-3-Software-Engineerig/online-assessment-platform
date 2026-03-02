import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database(settings.MONGO_DATABASE)
    u = await db.users.find_one({'name': {'$regex': 'Amirbek', '$options': 'i'}})
    print(f"USER: {u}")
    if u:
        # Check exams assigned to this phone
        phone = u.get('mobile_phone')
        print(f"PHONE: {phone}")
        exams = await db.exams.find({'assigned_students': phone}).to_list(None)
        print(f"ASSIGNED EXAMS: {[e['title'] for e in exams]}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
