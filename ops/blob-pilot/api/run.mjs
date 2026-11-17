import {emitSyntheticDiagnostics} from '../lib/diagnostics.mjs';
import {authenticated,config,run,recordScheduled} from '../lib/pilot.mjs';
import {createStore} from '../lib/store.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'method'});
 if(!authenticated(req.headers.authorization,req.method==='GET'?process.env.CRON_SECRET:process.env.PILOT_RUN_SECRET))return res.status(401).json({error:'unauthorized'});
 try{const store=createStore(),cfg=config(process.env);if(req.method==='GET')await recordScheduled(store,cfg);const result=await run(store,cfg);await emitSyntheticDiagnostics({method:req.method,env:process.env,store,result});return res.status(result.status==='failed'?503:result.status==='retry-exhausted'?429:200).json(result);}
 catch{return res.status(503).json({error:'synthetic-pilot-unavailable'});}
}
