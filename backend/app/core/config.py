from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MONGO_ROOT_USERNAME: str = "admin"
    MONGO_ROOT_PASSWORD: str = "admin"
    MONGO_HOST: str = "mongo"
    MONGO_PORT: int = 27018
    MONGO_DATABASE: str = "exam_platform"
    SECRET_KEY: str = "your-secret-key-change-in-production"  # TODO: Move to .env
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ADMIN_MOBILE_PHONE: str = "+1234567890"
    ADMIN_NAME: str = "Admin"
    ADMIN_SURNAME: str = "User"
    ADMIN_PASSWORD: str = "admin"  # TODO: Change in production
    
    @property
    def MONGODB_URI(self) -> str:
        return f"mongodb://{self.MONGO_ROOT_USERNAME}:{self.MONGO_ROOT_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DATABASE}?authSource=admin"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()

