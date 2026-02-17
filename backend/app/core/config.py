from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MONGO_ROOT_USERNAME: str = "admin"
    MONGO_ROOT_PASSWORD: str = "admin"
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27018
    MONGO_DATABASE: str = "exam_platform"
    
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

