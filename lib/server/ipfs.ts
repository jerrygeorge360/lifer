import { createHash } from "node:crypto";
import { PinataSDK } from "pinata";

export async function uploadAttestationToIpfs(payload: object): Promise<string> {
  const pinataJwt = process.env.PINATA_JWT;
  const content = JSON.stringify(payload);

  if (!pinataJwt) {
    return `local-${createHash("sha256").update(content).digest("hex").slice(0, 32)}`;
  }

  const pinata = new PinataSDK({ pinataJwt });
  const blob = new Blob([content], { type: "application/json" });
  const file = new File([blob], "attestation.json", { type: "application/json" });
  const response = await pinata.upload.public.file(file);

  if (!response.cid) {
    throw new Error("IPFS upload succeeded without cid");
  }

  return response.cid;
}
