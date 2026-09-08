import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawnSync,spawn} from 'node:child_process';
import {localStore} from '../app-core/local-store.mjs';
import {handleApi} from '../app-core/api.mjs';
const action=process.argv[2]||'start';
const directory=resolve(process.env.NORTHSTAR_DEMO_DIR||'.demo');
const credentialsPath=resolve(directory,'access.json');
mkdirSync(directory,{recursive:true,mode:0o700});
if(!existsSync(credentialsPath))writeFileSync(credentialsPath,JSON.stringify({email:'demo@northstar.local',password:randomBytes(18).toString('base64url'),legacyKey:randomBytes(24).toString('hex')},null,2),{mode:0o600,flag:'wx'});
const access=JSON.parse(readFileSync(credentialsPath,'utf8'));
const port=process.env.PORT||'3000';
const origin=process.env.CODESPACE_NAME?`https://${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN||'app.github.dev'}`:`http://localhost:${port}`;
const env={...process.env,NODE_ENV:'development',REACT_APP_BACKEND_URL:'',BUILD_PATH:'build',PORT:port,DATA_DIR:directory,BASE_URL:origin,ALLOWED_ORIGINS:origin,ADMIN_EMAIL:access.email,ADMIN_PASSWORD:access.password,ADMIN_API_KEY:access.legacyKey,USE_MOCK_AI:'true',STORAGE_PROVIDER:'local_json',OPENAI_API_KEY:'',TWILIO_ACCOUNT_SID:'',TWILIO_AUTH_TOKEN:'',TWILIO_PHONE_NUMBER:'',GOOGLE_CALENDAR_ID:'',GOOGLE_ACCESS_TOKEN:'',SUPABASE_URL:'',SUPABASE_ANON_KEY:'',VOICE_WEBHOOK_URL:''};
function run(command,args,runEnv=env){const result=spawnSync(command,args,{stdio:'inherit',env:runEnv,shell:process.platform==='win32'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
if(action==='setup'){
 run('npx',['--yes','--package=yarn@1.22.22','yarn','--cwd','frontend','install','--frozen-lockfile','--non-interactive']);
 run('npm',['run','dashboard:build'],{...env,NODE_ENV:'production'});
}
if(!['setup','start','credentials','init'].includes(action))throw new Error('Use setup, start, credentials, or init.');
if(action==='setup'||action==='init'||action==='start'){
 const db=localStore(directory);
 try{
  const login=await handleApi(new Request('http://localhost/api/auth/login',{method:'POST',body:JSON.stringify({email:access.email,password:access.password})}),env,db);
  if(!login.ok)throw new Error('Demo sign-in failed. Wait a minute before retrying.');
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const headers={Cookie:cookie};
  const seed=await handleApi(new Request('http://localhost/api/admin/seed',{method:'POST',headers,body:'{}'}),env,db);
  // A visitor may have switched off demo mode. Preserve their settings and data.
  if(!seed.ok&&seed.status!==403)throw new Error('Unable to load sample inventory.');
  await handleApi(new Request('http://localhost/api/auth/logout',{method:'POST',headers,body:'{}'}),env,db);
 }finally{db.close();}
}
console.log(`\nNorthstar personal demo\nOpen: ${origin}\nStaff email: ${access.email}\nStaff password: ${access.password}\n\nUse sample information only. Data stays in ${directory}.\nAI uses guided answers; external services are disabled.\n`);
if(action==='setup')console.log('Ready. Run npm run demo to start.');
if(action==='start'){
 if(!existsSync('frontend/build/index.html'))throw new Error('Run npm run demo:setup first to build the interface.');
 const child=spawn(process.execPath,['index.js'],{env,stdio:'inherit'});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
 child.on('exit',code=>{process.exitCode=code||0;});
}
