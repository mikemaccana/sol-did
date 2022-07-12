import { SolDid } from "../target/types/sol_did";
import { AnchorProvider, Program, web3, BN } from "@project-serum/anchor";
import { ethSignPayload, fetchProgram, findProgramAddress } from "./lib/utils";
import { DIDDocument } from "did-resolver";
import * as ethers from "ethers";


export class DidSolService {
  private program: Program<SolDid>;
  private solSigner: web3.Signer;
  private ethSigner: ethers.Signer | null = null;

  static async build(provider: AnchorProvider, didIdentifier: web3.PublicKey): Promise<DidSolService> {
    const program = await fetchProgram(provider);
    const [didDataAccount, _] = await findProgramAddress(didIdentifier);

    return new DidSolService(program, didIdentifier, didDataAccount, provider);
  }

  constructor(
    program: Program<SolDid>,
    private didIdentifier: web3.PublicKey,
    private didDataAccount: web3.PublicKey,
    private provider: AnchorProvider
  ) {
    this.program = new Program<SolDid>(
      program.idl,
      program.programId,
      provider,
      program.coder
    );

    this.solSigner = web3.Keypair.generate();
  }

  setSolSigner(signer: web3.Signer) {
    this.solSigner = signer;
  }

  setEthSigner(signer: ethers.Signer) {
    this.ethSigner = signer;
  }

  async close(destination: web3.PublicKey): Promise<String> {
    // If eth signer, generate an eth signature
    let ethSignature = null;
    if (this.ethSigner) {
      // read the nonce from the solana account
      const nonce = await this.program.account.didAccount.fetch(this.didDataAccount).then(account => account.nonce);
      const instruction = await this.program.methods.close(null).instruction();
      ethSignature = await ethSignPayload(instruction, nonce, this.ethSigner)
    }

    const tx = this.program.methods.close(ethSignature)
      .accounts({
        didData: this.didDataAccount,
        authority: this.solSigner.publicKey,
        destination: destination,
      })
      .signers([this.solSigner])
      .rpc()

    return tx;
  }


  // TODO Implement
  async resolve(): Promise<DIDDocument> {
    const didDataAccount = await this.program.account.didAccount.fetch(this.didDataAccount);

    return {
      "@context": undefined,
      alsoKnownAs: [],
      assertionMethod: [],
      authentication: [],
      capabilityDelegation: [],
      capabilityInvocation: [],
      controller: undefined,
      id: "asdf",
      keyAgreement: [],
      publicKey: [],
      service: [],
      verificationMethod: []
    };
  }


}