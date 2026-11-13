import { validateCaseImport, type StrategicCase } from './model';

/**
 * File-integrity checksum for exported ASRI case JSON.
 * A SHA-256 digest detects accidental edits and unsynchronised archives.
 * It is NOT a digital signature, authenticated audit trail or approval.
 * Existing unwrapped case JSON remains readable as legacy data.
 */
const FORMAT='asri-case-export';
const VERSION=1;
interface CaseEnvelope {
  format:typeof FORMAT;
  envelopeVersion:typeof VERSION;
  integrity:{algorithm:'SHA-256';digest:string};
  caseData:StrategicCase;
}
async function caseDigest(data:StrategicCase):Promise<string>{
  if(!globalThis.crypto?.subtle)throw new Error('Secure context required to calculate a case checksum');
  const bytes=new TextEncoder().encode(JSON.stringify(data));
  const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}

export async function exportCaseEnvelope(data:StrategicCase):Promise<string>{
  const validated=validateCaseImport(data);
  const envelope:CaseEnvelope={
    format:FORMAT,
    envelopeVersion:VERSION,
    integrity:{algorithm:'SHA-256',digest:await caseDigest(validated)},
    caseData:validated
  };
  return JSON.stringify(envelope,null,2);
}

export async function importCaseEnvelope(json:string):Promise<{
  data:StrategicCase;verifiedIntegrity:boolean;
}>{
  const raw:unknown=JSON.parse(json);
  if(!raw||typeof raw!=='object'||!('format' in raw))
    return {data:validateCaseImport(raw),verifiedIntegrity:false};
  const x=raw as Partial<CaseEnvelope>;
  if(x.format!==FORMAT||x.envelopeVersion!==VERSION||
    x.integrity?.algorithm!=='SHA-256'||typeof x.integrity.digest!=='string'||
    !/^[0-9a-f]{64}$/.test(x.integrity.digest))
    throw new Error('Unsupported case envelope or invalid checksum metadata');
  // Check the imported payload as received before any schema migration,
  // otherwise adding defaults could change the expected archived digest.
  const candidate=x.caseData;
  if(!candidate||typeof candidate!=='object')throw new Error('Case data missing');
  const actual=await caseDigest(candidate);
  if(actual!==x.integrity.digest)throw new Error('Case file integrity check failed: data have changed since export');
  return {data:validateCaseImport(candidate),verifiedIntegrity:true};
}
