import {
  PublicKeyBase58,
  PrivateKey,
  ClusterType,
} from '@identity.com/sol-did-client';
import * as DID from '@identity.com/sol-did-client';
import { Cluster } from '@solana/web3.js';
import { DIDDocument, VerificationMethod } from 'did-resolver';
import { Ed25519VerificationKey2018 } from '@digitalbazaar/ed25519-verification-key-2018';
import { findVerificationMethod } from '@digitalbazaar/did-io';

type Properties = {
  payer: PrivateKey;
};

type GetParameters = {
  did?: string;
  url?: string;
};

type RegisterParameters = {
  key: PublicKeyBase58;
  size: number;
  cluster: 'localnet' | Cluster;
};

type GenerateParameters = {
  size: number;
  cluster: 'localnet' | Cluster;
};

export class Driver {
  private payer: PrivateKey;
  public readonly method: string = 'sol';

  constructor({ payer }: Properties) {
    this.payer = payer;
  }

  async get({
    did,
    url,
  }: GetParameters): Promise<DIDDocument | VerificationMethod | undefined> {
    did = did || url;
    if (!did) {
      throw new TypeError('A "did" or "url" parameter is required.');
    }

    const [didAuthority, keyIdFragment] = did.split('#');

    const document = await DID.resolve(didAuthority);

    if (keyIdFragment) {
      return findVerificationMethod({ doc: document, methodId: did });
    }

    return document;
  }

  async register({ key, size = 1000, cluster }: RegisterParameters) {
    return DID.register({
      owner: key,
      payer: this.payer,
      size,
      cluster: ClusterType.parse(cluster),
    });
  }

  async generate({ size = 1000, cluster }: GenerateParameters) {
    const keyPair = await Ed25519VerificationKey2018.generate();

    const did = await DID.register({
      owner: keyPair.publicKeyBase58,
      payer: this.payer,
      size,
      cluster: ClusterType.parse(cluster),
    });

    const didDocument = await DID.resolve(did);

    if (!didDocument || !didDocument.verificationMethod) {
      throw new Error(`Unable to generate document`);
    }

    keyPair.id = didDocument.verificationMethod[0].id;
    keyPair.controller = didDocument.verificationMethod[0].controller;

    const keyPairs = new Map();
    keyPairs.set(keyPair.id, keyPair);

    const methodFor = (options: { purpose: string }) => {
      const { purpose } = options;

      return findVerificationMethod({
        doc: didDocument,
        purpose,
      });
    };

    return { didDocument, keyPairs, methodFor };
  }
}

const driver = (properties: Properties) => new Driver(properties);

export default { driver };
