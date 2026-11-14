/**
 * Local source checksum, never uploads bytes. A SHA-256 digest only proves
 * byte equality for two documents: it does not authenticate the source,
 * reviewer, revision history, approvals or legal signatures.
 */
export async function sha256EvidenceBlob(blob:Blob):Promise<string>{
  if(blob.size>30_000_000)throw new Error('Evidence file exceeds 30 MB local checksum limit');
  if(!globalThis.crypto?.subtle)throw new Error('Secure browser context required for SHA-256');
  const bytes=await blob.arrayBuffer();
  const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
