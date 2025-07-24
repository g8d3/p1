use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("BLSoSQCHeJ4wXLLiW8QWUosJvLzG3qJwv55P3XUBhpG2");

#[program]
pub mod launchpad {
    use super::*;

    // Initialize the launchpad
    pub fn initialize(ctx: Context<Initialize>, fee_percentage: u64) -> Result<()> {
        let launchpad = &mut ctx.accounts.launchpad;
        launchpad.authority = ctx.accounts.authority.key();
        launchpad.fee_percentage = fee_percentage; // e.g., 100 = 1%
        launchpad.total_fees = 0;
        Ok(())
    }

    // Create a new token
    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
        initial_supply: u64,
        creation_fee: u64,
    ) -> Result<()> {
        let launchpad = &mut ctx.accounts.launchpad;
        let token_mint = &mut ctx.accounts.token_mint;
        let creator_token = &mut ctx.accounts.creator_token;

        // Charge creation fee (0.05-0.1 SOL)
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(Mint::LEN);
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? -= creation_fee;
        **ctx.accounts.launchpad.to_account_info().try_borrow_mut_lamports()? += creation_fee;
        launchpad.total_fees += creation_fee;

        // Initialize token mint
        token::initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: token_mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            9, // Decimals
            &ctx.accounts.authority.key(),
            Some(&ctx.accounts.authority.key()),
        )?;

        // Mint initial supply to creator (e.g., 200M tokens)
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: token_mint.to_account_info(),
                    to: creator_token.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            initial_supply,
        )?;

        // Store token metadata
        let token_data = &mut ctx.accounts.token_data;
        token_data.mint = token_mint.key();
        token_data.creator = ctx.accounts.authority.key();
        token_data.name = name;
        token_data.symbol = symbol;
        token_data.uri = uri;
        token_data.supply = initial_supply;
        token_data.bonding_curve = 0; // Initial bonding curve state
        token_data.market_cap = 0;

        Ok(())
    }

    // Buy tokens on the bonding curve
    pub fn buy_tokens(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        let launchpad = &mut ctx.accounts.launchpad;

        // Calculate price based on bonding curve (simplified linear curve)
        let price = token_data.bonding_curve + amount; // Example: price increases with purchases
        let total_cost = price * amount;

        // Transfer SOL from buyer to launchpad
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= total_cost;
        **ctx.accounts.launchpad.to_account_info().try_borrow_mut_lamports()? += total_cost;

        // Mint tokens to buyer
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.buyer_token.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update bonding curve and market cap
        token_data.bonding_curve += amount;
        token_data.market_cap = price * token_data.supply;

        // Check for graduation (e.g., $100,000 market cap)
        if token_data.market_cap >= 100_000_000_000 { // 100,000 USD in lamports
            // Trigger graduation to DEX
            emit!(TokenGraduationEvent {
                mint: token_data.mint,
                market_cap: token_data.market_cap,
            });
        }

        Ok(())
    }

    // Reinvest fees into token burns or platform development
    pub fn reinvest_fees(ctx: Context<ReinvestFees>, amount: u64) -> Result<()> {
        let launchpad = &mut ctx.accounts.launchpad;
        require!(launchpad.total_fees >= amount, ErrorCode::InsufficientFees);

        // Example: Burn tokens or transfer to platform treasury
        **ctx.accounts.launchpad.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? += amount;
        launchpad.total_fees -= amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8)]
    pub launchpad: Account<'info, Launchpad>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub launchpad: Account<'info, Launchpad>,
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 8 + 8)]
    pub token_data: Account<'info, TokenData>,
    #[account(init, payer = authority, space = Mint::LEN)]
    pub token_mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = TokenAccount::LEN)]
    pub creator_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub launchpad: Account<'info, Launchpad>,
    #[account(mut)]
    pub token_data: Account<'info, TokenData>,
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub buyer_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReinvestFees<'info> {
    #[account(mut)]
    pub launchpad: Account<'info, Launchpad>,
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Launchpad {
    pub authority: Pubkey,
    pub fee_percentage: u64,
    pub total_fees: u64,
}

#[account]
pub struct TokenData {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub supply: u64,
    pub bonding_curve: u64,
    pub market_cap: u64,
}

#[event]
pub struct TokenGraduationEvent {
    pub mint: Pubkey,
    pub market_cap: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient fees for reinvestment")]
    InsufficientFees,
}
