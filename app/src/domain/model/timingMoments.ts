/** Shared deterministic risk-branch timing aggregation used by DEMO-60 and
 * Case Studio. This normalises branch probabilities; it does not assert that
 * their timing policies or accounting scopes are interchangeable.
 */
export interface TimedBranch {
  probability:number;
  completionTime:number;
  targetMet?:boolean;
}
export interface TimingMoments {
  meanCompletionTime:number;
  probabilityTargetMet:number|null;
}
export function aggregateTimingMoments(states:TimedBranch[]):TimingMoments{
  if(!states.length||states.some(s=>!Number.isFinite(s.probability)||
      s.probability<0||!Number.isFinite(s.completionTime)||s.completionTime<0))
    throw new RangeError('Invalid risk-branch probability or completion time');
  const total=states.reduce((sum,s)=>sum+s.probability,0);
  if(!Number.isFinite(total)||Math.abs(total-1)>1e-6)
    throw new RangeError('Risk branches must form a normalized probability distribution');
  const meanCompletionTime=states.reduce((sum,s)=>sum+s.probability*s.completionTime,0)/total;
  const allHaveTarget=states.every(s=>typeof s.targetMet==='boolean');
  const probabilityTargetMet=allHaveTarget
    ?states.reduce((sum,s)=>sum+(s.targetMet?s.probability:0),0)/total:null;
  return {meanCompletionTime,probabilityTargetMet};
}
