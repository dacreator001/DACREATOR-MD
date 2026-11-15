import { getContextInfo,normalizeJid,numberFromJid } from "../lib/message-utils.js";
import { jailRecords } from "../lib/jail.js";
const ids=p=>[p?.id,p?.jid,p?.lid,p?.pn,p?.phoneNumber].map(normalizeJid).filter(Boolean);
const admin=p=>p?.admin==="admin"||p?.admin==="superadmin"||p?.isAdmin;
async function auth(ctx){
 if(!String(ctx.jid).endsWith("@g.us")){await ctx.reply("Group only.");return null;}
 const metadata=await ctx.sock.groupMetadata(ctx.jid);
 const members=metadata.participants||[];
 if(!ctx.owner&&!members.some(p=>admin(p)&&ids(p).includes(normalizeJid(ctx.senderJid)))){await ctx.reply("⛔ Group admins only.");return null;}
 return members;
}
function target(ctx){
 const info=getContextInfo(ctx.msg?.message)||{};
 const raw=info.mentionedJid?.[0]||info.participant||"";
 if(raw)return normalizeJid(raw);
 const number=String(ctx.args||"").match(/\b\d{8,15}\b/)?.[0];
 return number?number+"@s.whatsapp.net":"";
}
export default [
 {name:"jail",category:"Group",description:"Restrict a member's messages: .jail @member",run:async ctx=>{
  const members=await auth(ctx);if(!members)return;
  const member=target(ctx);if(!member)return ctx.reply("Mention a member or reply to their message.");
  const participant=members.find(p=>ids(p).includes(member));
  if(!participant)return ctx.reply("Member not found in this group.");
  if(admin(participant)||ids(participant).some(x=>[ctx.sock.user?.id,ctx.sock.user?.lid].map(normalizeJid).includes(x)))return ctx.reply("Cannot jail an admin or the bot.");
  const self=[ctx.sock.user?.id,ctx.sock.user?.lid].map(normalizeJid);
  if(!members.some(p=>admin(p)&&ids(p).some(x=>self.includes(x))))return ctx.reply("Make DACREATOR-MD a group admin first.");
  await jailRecords.add(ctx.jid,member,ctx.senderJid);
  return ctx.send({text:"🔒 Jailed @"+numberFromJid(member)+". Their new messages will be deleted while the bot is online and an admin.",mentions:[member]});
 }},
 {name:"unjail",category:"Group",description:"Restore a jailed member: .unjail @member",run:async ctx=>{
  if(!await auth(ctx))return;
  const member=target(ctx);if(!member)return ctx.reply("Mention a member or reply to their message.");
  const removed=await jailRecords.remove(ctx.jid,member);
  return ctx.send({text:(removed?"🔓 Unjailed @":"Not jailed: @")+numberFromJid(member),mentions:[member]});
 }},
 {name:"jaillist",category:"Group",description:"List restricted members in this group",run:async ctx=>{
  if(!await auth(ctx))return;
  const entries=await jailRecords.list(ctx.jid);
  return ctx.send({text:"🔒 *JAILED MEMBERS*\n"+(entries.length?entries.slice(0,40).map((x,i)=>(i+1)+". @"+numberFromJid(x.jid)).join("\n"):"No jailed members."),mentions:entries.slice(0,40).map(x=>x.jid)});
 }}
];
