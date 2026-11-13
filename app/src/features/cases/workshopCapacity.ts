/**
 * Deliberately bounded DETERMINISTIC repair-workshop capacity example.
 * No arrival process, workshop downtime, skill constraints or random failures
 * are modelled. Its FIFO queue estimate is NEVER injected into the operational
 * recovery KPI: the two represent different assumptions.
 */
export interface WorkshopCapacityScenario {
  optionId:string;
  availableBays:number;
  jobsAhead:number;
  serviceTimePerBacklogJob:number;
  targetServiceTime:number;
  evidenceId:string;
}
export interface WorkshopCapacityEstimate {
  status:'notAssessed'|'calculated';
  waitingTime:number|null;
  completionTime:number|null;
  throughputPerTimeUnit:number|null;
  assumptions:string[];
}
export function evaluateWorkshopCapacity(
  scenario?:WorkshopCapacityScenario
):WorkshopCapacityEstimate {
  if(!scenario)return {status:'notAssessed',waitingTime:null,
    completionTime:null,throughputPerTimeUnit:null,
    assumptions:['No workshop capacity scenario entered. No queue delay or available capacity can be inferred.']};
  const {availableBays,jobsAhead,serviceTimePerBacklogJob,targetServiceTime}=scenario;
  if(!Number.isInteger(availableBays)||availableBays<1||availableBays>50||
    !Number.isInteger(jobsAhead)||jobsAhead<0||jobsAhead>10000||
    !Number.isFinite(serviceTimePerBacklogJob)||serviceTimePerBacklogJob<=0||serviceTimePerBacklogJob>1e5||
    !Number.isFinite(targetServiceTime)||targetServiceTime<=0||targetServiceTime>1e5)
    return {status:'notAssessed',waitingTime:null,completionTime:null,throughputPerTimeUnit:null,
      assumptions:['Invalid or incomplete workshop inputs.']};
  // Each bay works independently. All backlog jobs are ready at t=0; target
  // is inserted last, in FIFO order. No jobs arrive during the calculation.
  const waitingTime=Math.floor(jobsAhead/availableBays)*serviceTimePerBacklogJob;
  const completionTime=waitingTime+targetServiceTime;
  const throughputPerTimeUnit=availableBays/serviceTimePerBacklogJob;
  return {status:'calculated',waitingTime,completionTime,throughputPerTimeUnit,
    assumptions:[
      'Deterministic FIFO with all backlog jobs present at t=0, identical duration, and target last.',
      'All bays are operational and equally capable; no priorities, stochastic arrivals, interruptions or resource sharing.',
      'This is a user-supplied planning scenario, NOT a calibrated queue, an available repair slot or an Airbus commitment.',
      'Do NOT add this time to the universal recovery KPI unless an independently approved model accounts for overlap.'
    ]};
}
export function validateWorkshopCapacity(
  value:unknown,optionIds:string[]
):WorkshopCapacityScenario[] {
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>optionIds.length)throw new Error('Invalid workshop capacity register');
  const seen=new Set<string>();
  return value.map(entry=>{
    if(!entry||typeof entry!=='object'||Array.isArray(entry))
      throw new Error('Invalid workshop capacity scenario');
    const x=entry as Partial<WorkshopCapacityScenario>;
    if(typeof x.optionId!=='string'||!optionIds.includes(x.optionId)||seen.has(x.optionId)||
      !Number.isInteger(x.availableBays)||x.availableBays!<1||x.availableBays!>50||
      !Number.isInteger(x.jobsAhead)||x.jobsAhead!<0||x.jobsAhead!>10000||
      typeof x.serviceTimePerBacklogJob!=='number'||!Number.isFinite(x.serviceTimePerBacklogJob)||
      x.serviceTimePerBacklogJob<=0||x.serviceTimePerBacklogJob>1e5||
      typeof x.targetServiceTime!=='number'||!Number.isFinite(x.targetServiceTime)||
      x.targetServiceTime<=0||x.targetServiceTime>1e5||
      typeof x.evidenceId!=='string'||x.evidenceId.length>100)
      throw new Error('Invalid workshop capacity input');
    seen.add(x.optionId);
    return x as WorkshopCapacityScenario;
  });
}
