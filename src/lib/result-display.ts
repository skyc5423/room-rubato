import {recordedAxisScore} from './result-evidence';

/** Derived persona vectors are clamped to [-1,1] by persona-scoring. Never coerce persisted data. */
export function formatStoredScore(value:unknown):string {
 const score=recordedAxisScore({value},'value');
 return score===undefined?'저장된 점수 확인 불가':`${score>=0?'+':''}${score.toFixed(2)}`;
}
/** Milliseconds have no inferred upper cap; zero is a valid recorded duration. */
export function storedSeconds(value:unknown):string|null {
 return typeof value==='number'&&Number.isFinite(value)&&value>=0?(value/1000).toFixed(1):null;
}
