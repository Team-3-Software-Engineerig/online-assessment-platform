import asyncio
from app.db.db import connect_to_mongo
import app.db.db as db

async def check():
    await connect_to_mongo()
    u = await db.database.users.find().to_list(100)
    e = await db.database.exams.find().to_list(100)
    print("--- USERS ---")
    for x in u:
        print(f"Name: {x.get('name')}, Phone: {x.get('mobile_phone')}, Role: {x.get('role')}")
    print("\n--- EXAMS ---")
    for x in e:
        print(f"Title: {x.get('title')}, Assigned: {x.get('assigned_students')}")

if __name__ == "__main__":
    asyncio.run(check())
