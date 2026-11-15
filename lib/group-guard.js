import { groupModeration } from "./group-moderation.js";
import { normalizeJid } from "./message-utils.js";
const floods=new Map(),joins=new Map();
const isAdmin=p=>p?.admin==="admin"||p?.admin==="superadmin"||p?.isAdmin;
const ids=p=>[p?.id,p?.jid,p?.lid,p?.pn,p?.phoneNumber].map(normalizeJid).filter(Boolean);
export async function checkFlood({sock,msg,text}){
 const group=String(msg?.key?.remoteJid||"");
 if(!group.endsWith("@g.us")||msg?.key?.fromMe||!text)return false;
 if(!(await groupModeration.getSettings(group)).antiflood)return false;
 const sender=normalizeJid(msg.key.participantPn||msg.key.participant||"");
 if(!sender)return false;
 const now=Date.now(),key=group+":"+sender;
 const old=floods.get(key)||{text:"",times:[]};
 const normalized=String(text).trim().toLowerCase();
 const times=old.text===normalized?old.times.filter(t=>now-t<12000):[];
 times.push(now);floods.set(key,{text:normalized,times});
 if(floods.size>2000)floods.clear();
 if(times.length<4)return false;
 const members=(await sock.groupMetadata(group)).participants||[];
 if(members.some(p=>isAdmin(p)&&ids(p).includes(sender)))return false;
 const self=[sock.user?.id,sock.user?.lid].map(normalizeJid);
 if(!members.some(p=>isAdmin(p)&&ids(p).some(x=>self.includes(x))))return false;
 await sock.sendMessage(group,{delete:msg.key});
 return true;
}
export async function checkRaid({sock,update}){
 const group=String(update?.id||"");
 if(!group.endsWith("@g.us")||update.action!=="add")return;
 if(!(await groupModeration.getSettings(group)).antiraid)return;
 const now=Date.now(),old=(joins.get(group)||[]).filter(t=>now-t<30000);
 for(const _ of update.participants||[])old.push(now);
 joins.set(group,old);
 if(joins.size>500)joins.clear();
 if(old.length>=6&&(old.length-(update.participants||[]).length)<6){
  await sock.sendMessage(group,{text:"🛡️ *DACREATOR-MD RAID ALERT*\n6+ members joined within 30 seconds. Admins, review recent joins. No members were removed automatically."});
 }
}
