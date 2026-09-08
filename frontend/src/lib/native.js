import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {Clipboard} from '@capacitor/clipboard';
export const isNative=()=>Capacitor.isNativePlatform();
export async function copyText(value){if(isNative())return Clipboard.write({string:value});return navigator.clipboard.writeText(value)}
export function listenBack(callback){return App.addListener('backButton',callback)}
export function minimize(){return App.minimizeApp()}
export async function exportCsv(csv){
 if(isNative()){
  const file=await Filesystem.writeFile({path:'northstar-leads.csv',directory:Directory.Cache,data:csv,encoding:Encoding.UTF8});
  await Share.share({title:'Northstar leads',files:[file.uri],dialogTitle:'Export leads'});
  return;
 }
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='northstar-leads.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
