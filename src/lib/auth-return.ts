const errorKeys=['error','error_code','error_description'];
// Do not mistake ordinary app error/code/type query parameters for an auth return.
const oauthErrors=new Set(['access_denied','server_error','temporarily_unavailable','invalid_request','unauthorized_client','unsupported_response_type','invalid_scope','invalid_grant']);
const authErrorCodes=new Set(['otp_expired','otp_disabled','flow_state_expired','flow_state_not_found','bad_oauth_callback','bad_oauth_state','oauth_provider_not_supported','provider_email_needs_verification','email_not_confirmed']);
// Only used on an explicit failed auth return, after the SDK has initialized.
const callbackKeys=[...errorKeys,'access_token','refresh_token','provider_token','provider_refresh_token','token_type','expires_in','expires_at'];
export function failedAuthReturnPath(href:string):string|null {
 try{
  const url=new URL(href);
  if(!['https:','http:'].includes(url.protocol))return null;
  const hash=new URLSearchParams(url.hash.slice(1));
  // Match the installed SDK: fragment first, then query; last duplicate wins.
  const effective=new Map<string,string>();hash.forEach((value,key)=>effective.set(key,value));url.searchParams.forEach((value,key)=>effective.set(key,value));
  if(!oauthErrors.has(effective.get('error')||'')&&!authErrorCodes.has(effective.get('error_code')||''))return null;
  const hasAuthMaterial=['access_token','refresh_token','provider_token','provider_refresh_token'].some(key=>hash.has(key)||url.searchParams.has(key))||['signup','recovery','invite','magiclink','email_change'].includes(effective.get('type')||'');
  const remove=hasAuthMaterial?[...callbackKeys,'code','type']:callbackKeys;
  let hashChanged=false;
  for(const key of remove){url.searchParams.delete(key);if(hash.has(key)){hash.delete(key);hashChanged=true;}}
  if(hashChanged)url.hash=hash.toString();
  // Never return a destination origin, follow a next URL, or retain raw provider errors.
  return `${url.pathname}${url.search}${url.hash}`;
 }catch{return null;}
}
