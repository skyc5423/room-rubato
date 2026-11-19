/** Vercel Node(req,res) adapter. No body parsing, redirects, credentials or target discovery. */
import {handleBackup} from '../runtime.mjs';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 let response;
 try{
  const headers=new Headers();
  for(const name of ['authorization','content-length','transfer-encoding']){
   const value=req.headers?.[name];
   if(Array.isArray(value))throw Error('ambiguous header');
   if(value!==undefined)headers.set(name,value);
  }
  // Reject body framing without consuming or logging an incoming stream.
  const length=headers.get('content-length');
  const body=headers.has('transfer-encoding')||(length!==null&&length!=='0')||(req.body!==undefined&&req.body!==null)?{}:null;
  const url=new URL(req.url||'/', 'https://backup.invalid');
  response=await handleBackup({method:req.method,url:url.href,headers,body});
 }catch{response=new Response(JSON.stringify({code:'REQUEST_NOT_ACCEPTED'}),{status:400,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});}
 res.statusCode=response.status;
 response.headers.forEach((value,name)=>res.setHeader(name,value));
 res.end(await response.text());
}
