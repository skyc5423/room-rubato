/** Read only the latest matching saved entry. An invalid latest value is not an answer. */
export function recordedChoice(log:readonly unknown[],domainId:number,questionId:string):'A'|'B'|null {
  const entry=[...log].reverse().find((item):item is Record<string,unknown>=>
    !!item&&typeof item==='object'&&'domainId' in item&&'questionId' in item&&item.domainId===domainId&&item.questionId===questionId);
  return entry?.chosenOption==='A'||entry?.chosenOption==='B'?entry.chosenOption:null;
}
