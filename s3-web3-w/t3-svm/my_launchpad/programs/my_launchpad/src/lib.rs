use anchor_lang::prelude::*;

pub mod launchpad;
pub mod dex;

use launchpad::*;
use dex::*;

declare_id!("BLSoSQCHeJ4wXLLiW8QWUosJvLzG3qJwv55P3XUBhpG2");

#[program]
pub mod my_launchpad {
    use super::*;

    // Launchpad instructions
    pub fn initialize(ctx: Context<Initialize>, fee_percentage: u64) -> Result<()> {
        launchpad::initialize(ctx, fee_percentage)
    }

    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
        initial_supply: u64,
        creation_fee: u64,
    ) -> Result<()> {
        launchpad::create_token(ctx, name, symbol, uri, initial_supply, creation_fee)
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
        launchpad::buy_tokens(ctx, amount)
    }

    pub fn reinvest_fees(ctx: Context<ReinvestFees>, amount: u64) -> Result<()> {
        launchpad::reinvest_fees(ctx, amount)
    }

    // DEX instructions
    pub fn initialize_dex(ctx: Context<InitializeDex>, swap_fee: u64) -> Result<()> {
        dex::initialize_dex(ctx, swap_fee)
    }

    pub fn migrate_token(ctx: Context<MigrateToken>, liquidity_amount: u64) -> Result<()> {
        dex::migrate_token(ctx, liquidity_amount)
    }

    pub fn swap_tokens(ctx: Context<SwapTokens>, amount_in: u64) -> Result<()> {
        dex::swap_tokens(ctx, amount_in)
    }

    pub fn distribute_revenue(ctx: Context<DistributeRevenue>, amount: u64) -> Result<()> {
        dex::distribute_revenue(ctx, amount)
    }
}
