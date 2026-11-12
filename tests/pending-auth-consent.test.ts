import {it,expect} from 'vitest';
import {pendingAuthConsentAt} from '../src/lib/pending-auth-consent';
it('only accepts matching finite timestamps in the elapsed fifteen-minute window',()=>{
 const now=Date.parse('2026-11-12T12:00:00Z');const raw=(at:unknown,version='v')=>JSON.stringify({at,version});
 expect(pendingAuthConsentAt(raw('2026-11-12T11:59:00Z'),'v',now)).toBe('2026-11-12T11:59:00Z');expect(pendingAuthConsentAt(raw('2026-11-12T12:00:00Z'),'v',now)).not.toBeNull();
 for(const value of [raw('2026-11-12T12:00:01Z'),raw('2026-11-12T11:45:00Z'),raw('invalid'),raw(123),raw('2026-11-12T11:59:00Z','old'),null,'bad'])expect(pendingAuthConsentAt(value,'v',now)).toBeNull();
});
