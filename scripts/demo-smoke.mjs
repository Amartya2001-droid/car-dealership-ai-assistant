import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
const directory=mkdtempSync(join(tmpdir(),'northstar-demo-smoke-'));
const port='3197',base=`http://localhost:${port}/api`;
const child=spawn(process.execPath,['scripts/demo.mjs','start'],{env:{...process.env,PORT:port,NORTHSTAR_DEMO_DIR:directory,CODESPACE_NAME:''},stdio:'ignore'});
const exited=once(child,'exit');
try{
 let config;
 for(let i=0;i<50;i++){
  try{const response=await fetch(base+'/config');if(response.ok){config=await response.json();break;}}catch{}
  if(child.exitCode!==null)throw new Error('Demo server exited before becoming ready.');
  await delay(200);
 }
 assert.equal(config?.aiMode,'guided');
 const vehicles=await (await fetch(base+'/inventory')).json();assert.equal(vehicles.vehicles.length,4);
 assert.equal((await fetch(base+'/admin/overview')).status,401);
 const access=JSON.parse(readFileSync(join(directory,'access.json'),'utf8'));
 const post=(path,body,headers={})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 const login=await post('/auth/login',{email:access.email,password:access.password});assert.equal(login.status,200);
 const headers={Cookie:login.headers.get('set-cookie').split(';')[0]};
 const created=await post('/inquiries',{name:'Demo visitor',email:'demo@example.test',message:'I would like a test drive.',vehicleId:vehicles.vehicles[0].id});assert.equal(created.status,201);
 const receipt=await created.json();
 const overview=await(await fetch(base+'/admin/overview',{headers})).json();assert.equal(overview.leads.length,1);
 const tracked=await(await post('/request/status',{token:receipt.trackingToken})).json();assert.equal(tracked.status,'new');
 assert.equal((await post('/request/delete',{token:receipt.trackingToken})).status,200);
 console.log('Demo smoke passed: sample inventory, private login, inquiry, staff record, tracking and deletion.');
}finally{
 child.kill('SIGTERM');await exited;rmSync(directory,{recursive:true,force:true});
}
