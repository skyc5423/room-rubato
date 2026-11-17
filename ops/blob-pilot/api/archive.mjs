import {authenticated,config,artifact} from '../lib/pilot.mjs';
import {createStore} from '../lib/store.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(!authenticated(req.headers.authorization,process.env.PILOT_RUN_SECRET))return res.status(401).json({error:'unauthorized'});
 if(!req.body||Object.keys(req.body).length!==1||!/^\d{4}-\d{2}-\d{2}$/.test(req.body?.runId??''))return res.status(400).json({error:'day'});
 try {const raw=await artifact(createStore(),config(process.env,Date.now(),true),req.body.runId);res.setHeader('Content-Type','application/json');return res.status(200).send(raw);}
 catch{return res.status(404).json({error:'not-available'});}
}
