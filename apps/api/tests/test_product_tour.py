import unittest

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import Base, _migrate_user_columns
from app.models import User
from app.routers.auth import set_tour
from app.schemas import TourRequest, UserOut


class ProductTourTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def test_new_user_has_not_seen_the_tour_until_it_is_finished(self):
        async with self.sessions() as db:
            user = User(email="tour@example.com", name="Tour")
            db.add(user)
            await db.commit()
            self.assertIsNone(UserOut.model_validate(user).tour_completed_at)

            finished = await set_tour(TourRequest(completed=True), user=user, db=db)
            self.assertIsNotNone(UserOut.model_validate(finished).tour_completed_at)

            reset = await set_tour(TourRequest(completed=False), user=user, db=db)
            self.assertIsNone(UserOut.model_validate(reset).tour_completed_at)

    async def test_existing_users_table_gains_the_tour_column(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        try:
            async with engine.begin() as connection:
                await connection.execute(text(
                    "CREATE TABLE users (id VARCHAR(32) PRIMARY KEY, email VARCHAR(255), name VARCHAR(255), "
                    "password_hash VARCHAR(255), auth_provider VARCHAR(32))"
                ))
                await connection.run_sync(_migrate_user_columns)
                columns = await connection.run_sync(lambda sync: {c["name"] for c in inspect(sync).get_columns("users")})
            self.assertIn("tour_completed_at", columns)
        finally:
            await engine.dispose()


if __name__ == "__main__":
    unittest.main()
