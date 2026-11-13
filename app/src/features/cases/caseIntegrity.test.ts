import { describe, expect, it } from 'vitest';
import { exportCaseEnvelope, importCaseEnvelope } from './caseIntegrity';
import { fromPreset } from './presets';
import { validateCaseImport } from './model';

describe('ASRI saved-case integrity',()=>{
  it('round-trips a checksummed case with unchanged data and no claims of approval',async()=>{
    const c=fromPreset('ecodesign','es');
    const exported=await exportCaseEnvelope(c);
    const envelope=JSON.parse(exported);
    expect(envelope.format).toBe('asri-case-export');
    expect(envelope.integrity.algorithm).toBe('SHA-256');
    expect(envelope.envelopeVersion).toBe(2);
    expect(envelope.integrity.canonicalization).toBe('sorted-keys-v1');
    expect(envelope.integrity.digest).toMatch(/^[a-f0-9]{64}$/);
    const restored=await importCaseEnvelope(exported);
    expect(restored.verifiedIntegrity).toBe(true);
    expect(restored.data.options[1].parameterValues.baseRecovery.value)
      .toBe(c.options[1].parameterValues.baseRecovery.value);
    expect(restored.data.hypothetical).toBe(true);
  });
  it('rejects edited values and fabricated checksums',async()=>{
    const raw=JSON.parse(await exportCaseEnvelope(fromPreset('saf')));
    raw.caseData.options[1].parameterValues.baseRecovery.value=999;
    await expect(importCaseEnvelope(JSON.stringify(raw))).rejects.toThrow(/integrity check failed/);
    raw.integrity.digest='not-a-digest';
    await expect(importCaseEnvelope(JSON.stringify(raw))).rejects.toThrow(/checksum metadata/);
  });
  it('accepts semantically identical JSON with reordered property keys, rejects actual data changes',async()=>{
    const envelope=JSON.parse(await exportCaseEnvelope(fromPreset('ecodesign')));
    const original=envelope.caseData;
    envelope.caseData=Object.fromEntries(Object.entries(original).reverse());
    envelope.caseData.options=envelope.caseData.options.map((x:object)=>
      Object.fromEntries(Object.entries(x).reverse()));
    const restored=await importCaseEnvelope(JSON.stringify(envelope));
    expect(restored.verifiedIntegrity).toBe(true);
    envelope.caseData.options[1].parameterValues.baseRecovery.value=333;
    await expect(importCaseEnvelope(JSON.stringify(envelope))).rejects.toThrow(/integrity check failed/);
  });
  it('continues to verify legacy V1 envelope checksums calculated before canonicalisation',async()=>{
    const c=validateCaseImport(fromPreset('wildfire'));
    const bytes=new TextEncoder().encode(JSON.stringify(c));
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
      b=>b.toString(16).padStart(2,'0')).join('');
    const legacy={format:'asri-case-export',envelopeVersion:1,
      integrity:{algorithm:'SHA-256',digest},caseData:c};
    const result=await importCaseEnvelope(JSON.stringify(legacy));
    expect(result.verifiedIntegrity).toBe(true);
    expect(result.data.kind).toBe('wildfire');
  });
  it('keeps existing version-1 files importable but marks them as unverified',async()=>{
    const original=fromPreset('wildfire','en');
    const restored=await importCaseEnvelope(JSON.stringify(original));
    expect(restored.verifiedIntegrity).toBe(false);
    expect(restored.data.kind).toBe('wildfire');
  });
});
