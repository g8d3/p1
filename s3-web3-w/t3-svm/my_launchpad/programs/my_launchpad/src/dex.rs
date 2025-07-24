use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[program]
pub mod dex {
    use super::*;

    // Initialize the DEX
    pub fn initialize_dex(ctx: Context<InitializeDex>, swap_fee: u64) -> Result<()> {
        let dex = &mut ctx.accounts.dex;
        dex.authority = ctx.accounts.authority.key();
        dex.swap_fee = swap_fee; // e.g., 25 = 0.25%
        dex.total_fees = 0;
        Ok(())
    }

    // Migrate token from launchpad to DEX
    pub fn migrate_token(ctx: Context<MigrateToken>, liquidity_amount: u64) -> Result<()> {
        let dex = &mut ctx.accounts.dex;
        let token_data = &ctx.accounts.token_data;

        // Lock liquidity in DEX pool
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.creator_token.to_account_info(),
                    to: ctx.accounts.pool_token.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            liquidity_amount,
        )?;

        // Transfer SOL for liquidity
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? -= liquidity_amount;
        **ctx.accounts.pool.to_account_info().try_borrow_mut_lamports()? += liquidity_amount;

        // Update token data
        let token_data = &mut ctx.accounts.token_data;
        token_data.supply -= liquidity_amount;

        emit!(TokenMigrationEvent {
            mint: token_data.mint,
            liquidity_amount,
        });

        Ok(())
    }

    // Swap tokens in AMM pool
    pub fn swap_tokens(ctx: Context<SwapTokens>, amount_in: u64) -> Result<()> {
        let dex = &mut ctx.accounts.dex;

        // Calculate swap amount (simplified constant product formula)
        let k = ctx.accounts.pool_token.amount * ctx.accounts.pool.lamports();
        let amount_out = (k / (ctx.accounts.pool_token.amount + amount_in)) * amount_in;

        // Apply swap fee (0.25%)
        let fee = amount_out * dex.swap_fee / 10000;
        let amount_out_after_fee = amount_out - fee;
        dex.total_fees += fee;

        // Transfer input tokens
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.pool_token.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_in,
        )?;

        // Transfer output tokens
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.pool_token.to_account_info(),
                    to: ctx.accounts.user_token.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount_out_after_fee,
        )?;

        Ok(())
    }

    // Distribute revenue to creators
    pub fn distribute_revenue(ctx: Context<DistributeRevenue>, amount: u64) -> Result<()> {
        let dex = &mut ctx.accounts.dex;
        require!(dex.total_fees >= amount, ErrorCode::InsufficientFees);

        // Transfer fees to creator
        **ctx.accounts.dex.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += amount;
        dex.total_fees -= amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeDex<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8)]
    pub dex: Account<'info, Dex>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MigrateToken<'info> {
    #[account(mut)]
    pub dex: Account<'info, Dex>,
    #[account(mut)]
    pub token_data: Account<'info, TokenData>,
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub creator_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub dex: Account<'info, Dex>,
    #[account(mut)]
    pub pool_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool: AccountInfo<'info>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeRevenue<'info> {
    #[account(mut)]
    pub dex: Account<'info, Dex>,
    #[account(mut)]
    pub creator: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Dex {
    pub authority: Pubkey,
    pub swap_fee: u64,
    pub total_fees: u64,
}

#[event]
pub struct TokenMigrationEvent {
    pub mint: Pubkey,
    pub liquidity_amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient fees for distribution")]
    InsufficientFees,
}
