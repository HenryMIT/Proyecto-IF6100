from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MYSQL_USER: str 
    MYSQL_PASSWORD: str
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DB: str
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

class SettingsService(BaseSettings):    
    EMAIL_HOST: str
    EMAIL_USER: str
    EMAIL_CODE: str
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
class SettingsService_Test(BaseSettings):
    EMAIL_PORT_TEST: int
    EMAIL_HOST_TEST: str
    EMAIL_USER_TEST: str
    EMAIL_PASSWORD_TEST: str
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
settings_service = SettingsService()
settings_service_test = SettingsService_Test()
