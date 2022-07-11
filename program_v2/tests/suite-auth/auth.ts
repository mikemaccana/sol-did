import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolDid } from "../../target/types/sol_did";
import { PublicKey } from '@solana/web3.js';

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";

import { DEFAULT_SEED_STRING, INITIAL_ACCOUNT_SIZE } from "../utils/const";
import { findProgramAddress, VerificationMethodFlags } from "../utils/utils";
import { before } from "mocha";


chai.use(chaiAsPromised);

describe("sol-did alloc operations", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  let didData, didDataPDABump;

  const program = anchor.workspace.SolDid as Program<SolDid>;
  const programProvider = program.provider as anchor.AnchorProvider;

  const authority = programProvider.wallet;
  const newKey = anchor.web3.Keypair.generate();

  before(async () => {
    [didData, didDataPDABump] = await findProgramAddress(authority.publicKey);
  })

  it("fails when trying to close a did:sol account with a wrong authority", async () => {
    const wrongAuthority = anchor.web3.Keypair.generate();

    return expect(program.methods.close()
      .accounts({
        didData,
        authority: wrongAuthority.publicKey,
        destination: wrongAuthority.publicKey,
      })
      .signers([wrongAuthority])
      .rpc()).to.be.rejectedWith(' Error Number: 2003. Error Message: A raw constraint was violated');
  });

  it("can add a new Ed25519VerificationKey2018 Key with CapabilityInvocation to an account", async () => {
    const tx = await program.methods.addVerificationMethod({
      alias: "new-key",
      keyData: newKey.publicKey.toBytes(),
      method: 0,
      flags: VerificationMethodFlags.CapabilityInvocation,
    }).accounts({
      didData,
      authority: authority.publicKey
    }).rpc();
    console.log("Your transaction signature", tx);

    const didDataAccount = await program.account.didAccount.fetch(didData)

    expect(didDataAccount.verificationMethods.length).to.equal(1)
    expect(didDataAccount.verificationMethods[0].alias).to.equal("new-key")
    expect(didDataAccount.verificationMethods[0].keyData).to.deep.equal(newKey.publicKey.toBytes())
    expect(didDataAccount.verificationMethods[0].method).to.deep.equal( { ed25519VerificationKey2018: {} })
    expect(didDataAccount.verificationMethods[0].flags).to.equal(VerificationMethodFlags.CapabilityInvocation)
  });

  it("can use the new ed25519VerificationKey2018 Key add a Service to the account", async () => {

    await program.methods.addService({
      id: "aws",
      serviceType: "serviceType2",
      serviceEndpoint: "test2"
    }).accounts({
      didData,
      authority: newKey.publicKey
    }).signers([newKey])
      .rpc()


    const didDataAccount = await program.account.didAccount.fetch(didData)

    expect(didDataAccount.services.length).to.equal(1)
    expect(didDataAccount.services[0].id).to.equal("aws")
    expect(didDataAccount.services[0].serviceType).to.equal("serviceType2")
    expect(didDataAccount.services[0].serviceEndpoint).to.equal("test2")
  });

  it("can not add a new key with OwnershipProof to an account", async () => {
    return expect(program.methods.addVerificationMethod({
      alias: "new-key",
      keyData: newKey.publicKey.toBytes(),
      method: 0,
      flags: VerificationMethodFlags.OwnershipProof,
    }).accounts({
      didData,
      authority: authority.publicKey
    }).rpc()).to.be.rejectedWith('Error Message: Cannot add a verification method with OwnershipProof flag');
  });

  it("can not add a key if the alias already exists", async () => {
    return expect(program.methods.addVerificationMethod({
      alias: "default",
      keyData: newKey.publicKey.toBytes(),
      method: 0,
      flags: VerificationMethodFlags.CapabilityInvocation,
    }).accounts({
      didData,
      authority: authority.publicKey
    }).rpc()).to.be.rejectedWith('Error Message: Given VM alias is already in use');
  });


});
