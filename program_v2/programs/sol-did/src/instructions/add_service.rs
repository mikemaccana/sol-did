use crate::state::{DidAccount, Service};
use anchor_lang::prelude::*;

pub fn add_service(ctx: Context<AddService>, service: Service) -> Result<()> {
    let data = &mut ctx.accounts.data;
    data.services.push(service);
    Ok(())
}


#[derive(Accounts)]
pub struct AddService<'info> {
    #[account(mut, seeds = [b"did-account", authority.key().as_ref()], bump )]
    pub data: Account<'info, DidAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}