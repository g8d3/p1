use anchor_lang::prelude::*;

declare_id!("2STqcvKVCstVncE5vGa5xRJw23VW5PPQ1nHUSkPkKR5Q");

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
