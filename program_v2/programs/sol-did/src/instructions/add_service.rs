use crate::errors::DidSolError;
use crate::state::{DidAccount, Service};
use anchor_lang::prelude::*;

pub fn add_service(ctx: Context<AddService>, service: Service) -> Result<()> {
    let data = &mut ctx.accounts.did_data;
    if data.services.iter().all(|x| x.id != service.id) {
        data.services.push(service);
        Ok(())
    } else {
        Err(error!(DidSolError::RepetitiveService))
    }
}

#[derive(Accounts)]
pub struct AddService<'info> {
    #[account(
        mut,
        seeds = [b"did-account", did_data.initial_authority.key().as_ref()],
        bump = did_data.bump,
        constraint = did_data.is_authority(authority.key())
    )]
    pub did_data: Account<'info, DidAccount>,
    pub authority: Signer<'info>,
}
