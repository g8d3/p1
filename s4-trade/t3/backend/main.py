from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import SQLModel, create_engine, Session, select
from typing import Optional, List
from pydantic import Field
import os
from contextlib import asynccontextmanager

# Environment variable for database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    create_db_and_tables()
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

def get_session():
    with Session(engine) as session:
        yield session

# Define your SQLModel schemas here
class Trader(SQLModel, table=True):
    __tablename__ = "trader"
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

# CRUD Endpoints for Trader
@app.post("/traders/", response_model=Trader)
def create_trader(*, trader: Trader, session: Session = Depends(get_session)):
    session.add(trader)
    session.commit()
    session.refresh(trader)
    return trader

@app.get("/traders/", response_model=List[Trader])
def read_traders(session: Session = Depends(get_session)):
    traders = session.exec(select(Trader)).all()
    return traders

@app.get("/traders/{trader_id}", response_model=Trader)
def read_trader(*, trader_id: int, session: Session = Depends(get_session)):
    trader = session.get(Trader, trader_id)
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")
    return trader

@app.put("/traders/{trader_id}", response_model=Trader)
def update_trader(*, trader_id: int, trader: Trader, session: Session = Depends(get_session)):
    db_trader = session.get(Trader, trader_id)
    if not db_trader:
        raise HTTPException(status_code=404, detail="Trader not found")
    
    trader_data = trader.model_dump(exclude_unset=True)
    for key, value in trader_data.items():
        setattr(db_trader, key, value)
    
    session.add(db_trader)
    session.commit()
    session.refresh(db_trader)
    return db_trader

@app.delete("/traders/{trader_id}")
def delete_trader(*, trader_id: int, session: Session = Depends(get_session)):
    trader = session.get(Trader, trader_id)
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")
    session.delete(trader)
    session.commit()
    return {"ok": True}

# CRUD Endpoints for Token
@app.post("/tokens/", response_model=Token)
def create_token(*, token: Token, session: Session = Depends(get_session)):
    session.add(token)
    session.commit()
    session.refresh(token)
    return token

@app.get("/tokens/", response_model=List[Token])
def read_tokens(session: Session = Depends(get_session)):
    tokens = session.exec(select(Token)).all()
    return tokens

@app.get("/tokens/{token_id}", response_model=Token)
def read_token(*, token_id: int, session: Session = Depends(get_session)):
    token = session.get(Token, token_id)
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    return token

@app.put("/tokens/{token_id}", response_model=Token)
def update_token(*, token_id: int, token: Token, session: Session = Depends(get_session)):
    db_token = session.get(Token, token_id)
    if not db_token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    token_data = token.model_dump(exclude_unset=True)
    for key, value in token_data.items():
        setattr(db_token, key, value)
    
    session.add(db_token)
    session.commit()
    session.refresh(db_token)
    return db_token

@app.delete("/tokens/{token_id}")
def delete_token(*, token_id: int, session: Session = Depends(get_session)):
    token = session.get(Token, token_id)
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    session.delete(token)
    session.commit()
    return {"ok": True}

# CRUD Endpoints for TradingIdea
@app.post("/tradingideas/", response_model=TradingIdea)
def create_trading_idea(*, trading_idea: TradingIdea, session: Session = Depends(get_session)):
    session.add(trading_idea)
    session.commit()
    session.refresh(trading_idea)
    return trading_idea

@app.get("/tradingideas/", response_model=List[TradingIdea])
def read_trading_ideas(session: Session = Depends(get_session)):
    trading_ideas = session.exec(select(TradingIdea)).all()
    return trading_ideas

@app.get("/tradingideas/{trading_idea_id}", response_model=TradingIdea)
def read_trading_idea(*, trading_idea_id: int, session: Session = Depends(get_session)):
    trading_idea = session.get(TradingIdea, trading_idea_id)
    if not trading_idea:
        raise HTTPException(status_code=404, detail="Trading Idea not found")
    return trading_idea

@app.put("/tradingideas/{trading_idea_id}", response_model=TradingIdea)
def update_trading_idea(*, trading_idea_id: int, trading_idea: TradingIdea, session: Session = Depends(get_session)):
    db_trading_idea = session.get(TradingIdea, trading_idea_id)
    if not db_trading_idea:
        raise HTTPException(status_code=404, detail="Trading Idea not found")
    
    trading_idea_data = trading_idea.model_dump(exclude_unset=True)
    for key, value in trading_idea_data.items():
        setattr(db_trading_idea, key, value)
    
    session.add(db_trading_idea)
    session.commit()
    session.refresh(db_trading_idea)
    return db_trading_idea

@app.delete("/tradingideas/{trading_idea_id}")
def delete_trading_idea(*, trading_idea_id: int, session: Session = Depends(get_session)):
    trading_idea = session.get(TradingIdea, trading_idea_id)
    if not trading_idea:
        raise HTTPException(status_code=404, detail="Trading Idea not found")
    session.delete(trading_idea)
    session.commit()
    return {"ok": True}