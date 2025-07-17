from fastapi import FastAPI
from sqlmodel import SQLModel, create_engine, Session
from typing import Optional
from pydantic import Field
import os

# Environment variable for database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Define your SQLModel schemas here
class Trader(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    solana_address: Optional[str] = None
    evm_address: Optional[str] = None
    description: Optional[str] = None

class Token(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    symbol: str
    contract_address: str
    chain: str # e.g., "Solana", "Ethereum", "Polygon"
    description: Optional[str] = None

class TradingIdea(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    risk_reward_ratio: float
    statistical_data: Optional[str] = None # JSON string or similar
    token_id: Optional[int] = Field(default=None, foreign_key="token.id")
    trader_id: Optional[int] = Field(default=None, foreign_key="trader.id")

# Basic CRUD operations (FastAPI will generate these automatically with SQLModel)
# For full CRUD, you'd typically use a library like `fastapi-crudrouter` or implement them manually.
# For this initial setup, SQLModel handles the table creation and basic ORM.
# We'll add the actual API endpoints in the next step.
