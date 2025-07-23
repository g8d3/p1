use anchor_lang::prelude::*;

declare_id!("FdW8NpEGkdrnivWz8y2Xy753G26aFGhGL8qTUc95BMuE");

#[program]
pub mod launchpad {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
