import {expect,it} from 'vitest';
import {tasteLessons} from '../src/lib/taste-lessons';
it('links the music correction and distinguishes self-report, complexity measures and null results',()=>{
 const lesson=tasteLessons.find(l=>l.id==='syncopation')!;
 expect(lesson.sources.some(s=>s.url.endsWith('10.1371/journal.pone.0139409'))).toBe(true);
 const notes=lesson.sourceNotes!.join(' ');expect(notes).toContain('실제 신체 움직임');expect(notes).toContain('같은 값이 아닙니다');expect(notes).toContain('영향이 언제나 없다고 단정');
});
it('does not equate processing ease with artistic value or service learning efficacy',()=>{
 const lesson=tasteLessons.find(l=>l.id==='complexity')!;
 expect(lesson.sourceNotes!.join(' ')).toContain('예술적 가치를 구분');expect(lesson.sourceNotes!.join(' ')).toContain('시험한 연구는 아닙니다');expect(lesson.reviewedAt).toBe('2026.11.16');
});
