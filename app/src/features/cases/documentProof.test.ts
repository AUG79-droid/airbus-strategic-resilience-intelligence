import {describe,expect,it} from 'vitest';
import {sha256EvidenceBlob} from './documentProof';
import {createCase,evidenceReviewed,validateCaseImport} from './model';
describe('Source version, revocation and byte-integrity evidence',()=>{
  it('hashes the document locally without transferring it to a remote service',async()=>{
    const file=new Blob(['abc']);
    expect(await sha256EvidenceBlob(file)).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('does not count an expired or revoked claim as reviewed',()=>{
    const c=createCase();
    c.evidence=[{
      id:'E1',title:'Evidence',reference:'DOC-2026',
      owner:'Owner',reviewer:'Independent reviewer',reviewedOn:'2026-11-01',
      status:'reviewed',nature:'observed',limitations:'Scope',
      documentVersion:'1.2',documentSha256:'a'.repeat(64),
      excerptUsed:'Specific figure in table 2',validUntil:'2999-01-01'
    }];
    const measure={value:25,evidenceId:'E1'};
    expect(evidenceReviewed(c,measure)).toBe(true);
    c.evidence[0].validUntil='2020-01-01';
    expect(evidenceReviewed(c,measure)).toBe(false);
    c.evidence[0].validUntil='2999-01-01';
    c.evidence[0].revokedOn='2026-11-12';
    expect(evidenceReviewed(c,measure)).toBe(false);
    expect(validateCaseImport(c).evidence[0].revokedOn).toBe('2026-11-12');
  });
  it('rejects malformed digest and impossible revision/expiry dates on import',()=>{
    const c=createCase();
    const e={id:'E1',title:'Evidence',reference:'REF',owner:'Owner',
      reviewer:'Reviewer',reviewedOn:'2026-11-01',
      status:'reviewed' as const,nature:'observed' as const,limitations:''};
    c.evidence=[{...e,documentSha256:'not-a-hash'}];
    expect(()=>validateCaseImport(c)).toThrow(/Invalid evidence register/);
    c.evidence=[{...e,documentSha256:'f'.repeat(64),validUntil:'2026-02-31'}];
    expect(()=>validateCaseImport(c)).toThrow(/Invalid evidence register/);
  });
});
