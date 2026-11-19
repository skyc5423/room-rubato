import {status,authenticated,config} from '../lib/pilot.mjs';
import {createStore} from '../lib/store.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'method'});
 if(!authenticated(req.headers.authorization,process.env.PILOT_RUN_SECRET))return res.status(401).json({error:'unauthorized'});
 try {const result=await status(createStore(),config(process.env,Date.now(),true));return res.status(result.status==='fresh'?200:503).json(result);}
 catch{return res.status(503).json({synthetic:true,status:'unavailable'});}
}
