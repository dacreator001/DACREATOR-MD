import { getContextInfo, normalizeJid, numberFromJid } from "../lib/message-utils.js";
import { groupModeration } from "../lib/group-moderation.js";
import { jailRecords } from "../lib/jail.js";
const admin=p=>p?.admin==="admin"||p?.admin==="superadmin"||p?.isAdmin;
const ids=p=>[p?.id,p?.jid,p?.lid,p?.pn,p?.phoneNumber].map(normalizeJid).filter(Boolean);
async function requireAdmin(ctx,bot=false){
 if(!String(ctx.jid).endsWith("@g.us")){await ctx.reply("⛔ Group command only.");return null;}
 const metadata=await ctx.sock.groupMetadata(ctx.jid),members=metadata.participants||[];
 if(!ctx.owner&&!members.some(p=>admin(p)&&ids(p).includes(normalizeJid(ctx.senderJid)))){await ctx.reply("⛔ Group admins only.");return null;}
 if(bot&&!members.some(p=>admin(p)&&ids(p).some(x=>[ctx.sock.user?.id,ctx.sock.user?.lid].map(normalizeJid).includes(x)))){await ctx.reply("⛔ Make DACREATOR DAEMON a group admin first.");return null;}
 return members;
}
function target(ctx){
 const info=getContextInfo(ctx.msg?.message)||{};
 const mention=info.mentionedJid?.[0]||info.participant;
 if(mention)return normalizeJid(mention);
 const phone=String(ctx.args||"").match(/\b\d{8,15}\b/)?.[0];
 return phone?phone+"@s.whatsapp.net":"";
}
const cmd=(name,description,run)=>({name,category:"Group",description,run});
export default [
 cmd("unwarn","Remove one warning from a member",async ctx=>{
  if(!await requireAdmin(ctx))return;
  const user=target(ctx);if(!user)return ctx.reply("Usage: .unwarn @member");
  const result=await groupModeration.clearWarning(ctx.jid,user);
  return ctx.send({text:"⚡ @"+numberFromJid(user)+" warnings: "+result.before+" → "+result.after,mentions:[user]});
 }),
 cmd("resetwarn","Clear a member's warning history",async ctx=>{
  if(!await requireAdmin(ctx))return;
  const user=target(ctx);if(!user)return ctx.reply("Usage: .resetwarn @member");
  await groupModeration.clearWarning(ctx.jid,user,true);
  return ctx.send({text:"♛ Warnings reset for @"+numberFromJid(user),mentions:[user]});
 }),
 cmd("warnlimit","Set warning threshold from 2 to 10",async ctx=>{
  if(!await requireAdmin(ctx))return;
  const value=Number(String(ctx.args||"").trim());
  if(!Number.isInteger(value)||value<2||value>10){const s=await groupModeration.getSettings(ctx.jid);return ctx.reply("⚠️ Current limit: "+s.warnlimit+"\nUsage: .warnlimit 3 (2–10)");}
  await groupModeration.setWarnLimit(ctx.jid,value);
  return ctx.reply("♛ Warning limit set to "+value+".");
 }),
 cmd("antiflood","Toggle repeated-message detection",async ctx=>{
  if(!await requireAdmin(ctx,true))return;
  const value=String(ctx.args||"").trim().toLowerCase();
  if(!["on","off"].includes(value))return ctx.reply("Usage: .antiflood on/off");
  await groupModeration.setSetting(ctx.jid,"antiflood",value==="on");
  return ctx.reply("⚡ Antiflood "+value+". Repeated messages will be removed when enabled.");
 }),
 cmd("antiraid","Toggle rapid-join detection and alerts",async ctx=>{
  if(!await requireAdmin(ctx))return;
  const value=String(ctx.args||"").trim().toLowerCase();
  if(!["on","off"].includes(value))return ctx.reply("Usage: .antiraid on/off");
  await groupModeration.setSetting(ctx.jid,"antiraid",value==="on");
  return ctx.reply("🛡️ Antiraid "+value+". Rapid joins will trigger an admin alert.");
 }),
 cmd("nukepreview","Preview a moderation-settings reset",async ctx=>{
  if(!await requireAdmin(ctx))return;
  const s=await groupModeration.getSettings(ctx.jid),w=await groupModeration.listWarnings(ctx.jid),j=await jailRecords.list(ctx.jid);
  return ctx.reply("☠ *RESET PREVIEW*\nWarnings: "+w.length+" members\nJail records: "+j.length+" members\nSettings: "+JSON.stringify(s)+"\n\n.nuke confirm resets moderation settings and warnings ONLY. Jail records are preserved.");
 }),
 cmd("nuke","Reset bot-managed moderation settings with confirmation",async ctx=>{
  if(!await requireAdmin(ctx))return;
  if(String(ctx.args||"").trim().toLowerCase()!=="confirm")return ctx.reply("⚠️ This clears this group's warnings and moderation settings. Jail records remain.\nRun .nukepreview then .nuke confirm");
  await groupModeration.resetGroup(ctx.jid);
  return ctx.reply("♛ Moderation settings and warnings reset for this group. Jail records preserved.");
 }),
 {name:"crash",category:"Owner",description:"Run a harmless error-handling diagnostic",run:async ctx=>{
  if(!ctx.owner)return ctx.reply("⛔ Owner only.");
  try{throw new Error("DACREATOR DAEMON controlled diagnostic");}catch(error){return ctx.reply("⚡ *CRASH DIAGNOSTIC*\nError handling: PASS\nBot remained online.\nNo messages or accounts affected.");}
 }},
 {name:"crashstatus",category:"Owner",description:"Show bot connection diagnostic",run:async ctx=>{
  if(!ctx.owner)return ctx.reply("⛔ Owner only.");
  return ctx.reply("♛ *DACREATOR DAEMON STATUS*\nSession: "+ctx.sessionId+"\nConnected: "+Boolean(ctx.connectionOpen)+"\nMode: "+ctx.mode+"\nCommands loaded: "+ctx.commands.length);
 }}
];
