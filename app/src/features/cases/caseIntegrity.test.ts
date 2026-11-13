import { describe, expect, it } from 'vitest';
import { exportCaseEnvelope, importCaseEnvelope } from './caseIntegrity';
import { fromPreset } from './presets';

describe('ASRI saved-case integrity',()=>{
  it('round-trips a checksummed case with unchanged data and no claims of approval',async()=>{
    const c=fromPreset('ecodesign','es');
    const exported=await exportCaseEnvelope(c);
    const envelope=JSON.parse(exported);
    expect(envelope.format).toBe('asri-case-export');
    expect(envelope.integrity.algorithm).toBe('SHA-256');
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
  it('keeps existing version-1 files importable but marks them as unverified',async()=>{
    const original=fromPreset('wildfire','en');
    const restored=await importCaseEnvelope(JSON.stringify(original));
    expect(restored.verifiedIntegrity).toBe(false);
    expect(restored.data.kind).toBe('wildfire');
  });
});
