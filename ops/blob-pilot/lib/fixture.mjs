import {FORMAT,PROJECT} from './backup-core.mjs';
export const OWNER='00000000-0000-4000-8000-000000000001';
export function fixture(day) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(day).toISOString().slice(0,10)!==day) throw Error('Invalid day');
 const at=day+'T00:00:00.000Z',revision='00000000-0000-4000-8000-000000000002';
 return {format:FORMAT,project:PROJECT,snapshotId:'00000000-0000-4000-8000-000000000003',capturedAt:at,tables:{persona_profiles:[{user_id:OWNER,gender:null,age_group:null,occupation:null,completed_count:1,state:{synthetic:true,note:'SYNTHETIC ONLY: 색과 빛'},consent_agreed_at:at,consent_version:'synthetic-pilot',updated_at:at,revision,last_write_id:null}],taste_journals:[{user_id:OWNER,state:{synthetic:true,note:'SYNTHETIC ONLY: 질감 관찰'},revision,last_write_id:null,updated_at:at}]}};
}
