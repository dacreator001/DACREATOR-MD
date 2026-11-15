import path from "node:path";
import { createJsonStateStore } from "./state-store.js";
import { normalizeJid } from "./message-utils.js";

const store=createJsonStateStore({filePath:path.join(process.env.FEI_DATA_DIR||"./data","jail-records.json"),defaults:{groups:{}}});
const key=jid=>normalizeJid(jid);
export const jailRecords={
 async add(group,member,by){
  return store.update(s=>{const g=s.groups[group]||={};g[key(member)]={by:key(by),at:Date.now()};return true;});
 },
 async remove(group,member){
  return store.update(s=>{const g=s.groups[group]||{};const existed=Boolean(g[key(member)]);delete g[key(member)];return existed;});
 },
 async list(group){const groups=await store.get("groups");return Object.entries(groups?.[group]||{}).map(([jid,details])=>({jid,...details}));},
 async has(group,member){const groups=await store.get("groups");return Boolean(groups?.[group]?.[key(member)]);}
};
export async function enforceJail({sock,msg}){
 const group=String(msg?.key?.remoteJid||"");
 if(!group.endsWith("@g.us")||!msg?.message||msg.key.fromMe) return false;
 const sender=key(msg.key.participant||"");
 if(!sender||!await jailRecords.has(group,sender))return false;
 const metadata=await sock.groupMetadata(group);
 const parts=metadata?.participants||[];
 const ids=p=>[p.id,p.jid,p.lid,p.pn,p.phoneNumber].map(key);
 const isAdmin=p=>p.admin==="admin"||p.admin==="superadmin"||p.isAdmin;
 if(parts.some(p=>isAdmin(p)&&ids(p).includes(sender)))return false;
 const self=[sock.user?.id,sock.user?.lid].map(key);
 if(!parts.some(p=>isAdmin(p)&&ids(p).some(x=>self.includes(x))))return false;
 await sock.sendMessage(group,{delete:{remoteJid:group,fromMe:false,id:msg.key.id,participant:msg.key.participant}});
 return true;
}
