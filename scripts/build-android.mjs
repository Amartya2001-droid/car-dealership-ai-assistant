import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const origin=process.env.APP_BACKEND_URL;
if(!origin || !origin.startsWith('https://'))throw new Error('Set APP_BACKEND_URL to the public HTTPS deployment before building Android.');
execFileSync('npm',['--prefix','frontend','run','build'],{stdio:'inherit',env:{...process.env,BUILD_PATH:'build-android',REACT_APP_BACKEND_URL:origin}});
const original=readFileSync('capacitor.config.json','utf8');
try {
 const config=JSON.parse(original);config.webDir='frontend/build-android';
 writeFileSync('capacitor.config.json',JSON.stringify(config,null,2)+'\n');
 execFileSync('node',['node_modules/@capacitor/cli/bin/capacitor','sync','android'],{stdio:'inherit'});
} finally {writeFileSync('capacitor.config.json',original)}
console.log('Android web assets are ready. Run android/gradlew assembleDebug or bundleRelease.');
