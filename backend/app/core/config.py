from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MONGO_ROOT_USERNAME: str = ""
    MONGO_ROOT_PASSWORD: str = ""
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27017
    MONGO_DATABASE: str = "exam_platform"
    SECRET_KEY: str = "your-secret-key-change-in-production"  # TODO: Move to .env
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ADMIN_MOBILE_PHONE: str = "+1234567890"
    ADMIN_NAME: str = "Admin"
    ADMIN_SURNAME: str = "User"
    ADMIN_PASSWORD: str = "admin"  # TODO: Change in production
    
    @property
    def MONGODB_URI(self) -> str:
        # Use no-auth URI when credentials are not provided (local dev)
        if self.MONGO_ROOT_USERNAME and self.MONGO_ROOT_PASSWORD:
            return f"mongodb://{self.MONGO_ROOT_USERNAME}:{self.MONGO_ROOT_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DATABASE}?authSource=admin"
        return f"mongodb://{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DATABASE}"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()

