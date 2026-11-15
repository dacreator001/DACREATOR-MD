import { domainToASCII } from "node:url";
import dns from "node:dns/promises";
import net from "node:net";

const header = "『⚡』𝗗𝗔𝗖𝗥𝗘𝗔𝗧𝗢𝗥 𝗗𝗔𝗘𝗠𝗢𝗡 | 𝗖𝗬𝗕𝗘𝗥";
const say = (ctx, title, body) => ctx.reply(header + "\n\n*"+title+"*\n"+body);
const arg = ctx => String(ctx.args || "").trim();
const limit = (s,n=2500) => String(s).slice(0,n);
const host = value => {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 250) throw Error("Supply a domain or URL.");
  const h = new URL(raw.includes("://") ? raw : "https://"+raw).hostname.toLowerCase();
  const d = domainToASCII(h);
  if (!d || d==="localhost" || d.endsWith(".localhost") || !d.includes(".") || net.isIP(d) || /[^a-z0-9.-]/.test(d)) throw Error("Enter a public domain name.");
  return d;
};
const isPrivateIP = ip => {
  if (net.isIP(ip)===6) return true; // Conservative: no IPv6 fetches
  const n=ip.split(".").map(Number);
  return n[0]===0 || n[0]===10 || n[0]===127 || n[0]>=224 || (n[0]===169&&n[1]===254) || (n[0]===172&&n[1]>=16&&n[1]<=31) || (n[0]===192&&n[1]===168) || (n[0]===100&&n[1]>=64&&n[1]<=127) || (n[0]===192&&n[1]===0) || (n[0]===198&&(n[1]===18||n[1]===19));
};
const safeUrl = async value => {
  const u=new URL(String(value||""));
  if (u.protocol!=="https:" || u.username || u.password || (u.port && u.port!=="443")) throw Error("Use a public HTTPS URL on port 443.");
  const h=host(u.href);
  const ips=await dns.lookup(h,{all:true});
  if (!ips.length || ips.some(x=>isPrivateIP(x.address))) throw Error("Non-public address blocked.");
  return u;
};
const request = async (value,method="GET") => {
  const u=await safeUrl(value);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  try {
    const res=await fetch(u,{method,redirect:"manual",signal:controller.signal,headers:{"User-Agent":"DACREATOR DAEMON-Security-Audit/1.0"}});
    return res;
  } finally {clearTimeout(timer);}
};
const command=(name,description,fn)=>({name,category:"Cyber Security",description,run:async ctx=>{try{await fn(ctx);}catch(e){await say(ctx,"Request not completed",limit(e.message,200));}}});
const explain = (name,description,text)=>command(name,description,ctx=>say(ctx,name.toUpperCase(),text));
const auditNames=["xss","sqli","lfi","ssrf","openredirect","idor","xxe","ssti"];
const auditDescriptions={
 xss:"Check reflected output safely using an authorized test environment; review context-aware encoding and CSP.",
 sqli:"Review parameterized queries and database error handling in an authorized test environment.",
 lfi:"Review file-path normalization, allowlists and file access controls without reading sensitive files.",
 ssrf:"Review outbound request allowlists, DNS validation and blocked private-network destinations.",
 openredirect:"Review redirect destination validation and trusted-host allowlists.",
 idor:"Review object-level authorization with separate authorized test accounts.",
 xxe:"Review XML parser settings: disable external entities and DTD resolution.",
 ssti:"Review server-side template rendering: separate user data from template source."
};
const checks = auditNames.map(name=>command(name,"Defensive "+name.toUpperCase()+" assessment guidance",ctx=>say(ctx,name.toUpperCase()+" REVIEW",auditDescriptions[name]+"\n\nTarget (not scanned): "+limit(arg(ctx)||"not supplied",150))));
const secHeaders=["strict-transport-security","content-security-policy","x-content-type-options","referrer-policy","permissions-policy","x-frame-options"];
const headerAudit=async(ctx,kind)=>{
  const res=await request(arg(ctx),"HEAD");
  const lines=secHeaders.map(h=>(res.headers.has(h)?"✅ ":"⚠️ ")+h+": "+limit(res.headers.get(h)||"missing",180));
  if(kind==="cors") lines.push("Access-Control-Allow-Origin: "+(res.headers.get("access-control-allow-origin")||"not present"),"Access-Control-Allow-Credentials: "+(res.headers.get("access-control-allow-credentials")||"not present"));
  if(kind==="csp") lines.push("CSP present: "+(res.headers.has("content-security-policy")?"yes":"no"));
  await say(ctx,"HTTPS HEADER AUDIT","HTTP "+res.status+"\n"+(kind==="headers"?lines:lines.filter(x=>kind==="cors"?/Access-Control/.test(x):/content-security-policy|CSP present/.test(x))).join("\n")+"\n\nPassive check only; missing headers are not automatically exploitable.");
};
const guidance={
 scope:"Check the official HackerOne/Bugcrowd program policy manually. Test only explicitly in-scope assets and follow rate limits.",
 subdomain:"Passive discovery: inspect certificate transparency and DNS records for assets you own or are authorized to test. Brute forcing is not enabled.",
 wayback:"Review publicly archived URLs using web.archive.org. Archived content may be outdated or sensitive; respect scope.",
 params:"Inspect query parameter names on your own page; do not submit credentials or tokens.",
 js:"Use browser developer tools to inventory public JavaScript assets; do not collect private resources.",
 endpoints:"Inspect public API documentation and application-owned JavaScript; verify authorization before testing.",
 links:"Review links on authorized pages; avoid unrestricted crawling.",
 techstack:"Inspect response headers and publicly declared frameworks; fingerprinting can be inaccurate.",
 email:"Use a reputable breach notification service for an email address you control; do not expose breach passwords.",
 github:"Review a user's public GitHub profile and repository metadata only.",
 dork:"Use search engines for publicly indexed pages within the scope of your own assets.",
 leaks:"For domains you administer, use approved exposure monitoring; never retrieve or share leaked credentials.",
 payload:"Exploit payload generation is disabled. Use harmless markers and a controlled training lab.",
 bypass:"WAF evasion is not included. Review WAF configuration and permitted testing rules.",
 wordlist:"Safe sample parameter names: id, page, lang, sort, search, filter. No brute-force lists.",
 poc:"PoC template: asset, scope authorization, steps using harmless markers, expected vs actual, sanitized evidence, impact, remediation."
};
const guide=Object.entries(guidance).map(([name,body])=>explain(name,"Authorized "+name+" guidance",body));
const encode=command("encode","Encode text: .encode url|base64|html TEXT",async ctx=>{
 const m=arg(ctx).match(/^(url|base64|html)\s+([\s\S]+)$/i);
 if(!m) return say(ctx,"ENCODE","Usage: .encode url|base64|html TEXT");
 const t=limit(m[2],1000),type=m[1].toLowerCase();
 const out=type==="url"?encodeURIComponent(t):type==="base64"?Buffer.from(t).toString("base64"):t.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
 return say(ctx,"ENCODED "+type.toUpperCase(),limit(out));
});
const cvss=command("cvss","CVSS vector guidance",ctx=>say(ctx,"CVSS","Use the FIRST CVSS calculator for scoring: https://www.first.org/cvss/calculator/4-0\nVector supplied: "+limit(arg(ctx)||"none",180)+"\nThis command does not calculate a score."));
const severity=command("severity","Severity classification reference",ctx=>say(ctx,"SEVERITY","Informational: no demonstrated impact\nLow: limited impact\nMedium: meaningful constrained impact\nHigh: significant compromise\nCritical: broad or severe compromise\nActual severity depends on verified context and program policy."));
const report=command("report","Generate a safe bug bounty report template",ctx=>say(ctx,"BUG BOUNTY REPORT","Title:\nProgram and authorized asset:\nScope reference:\nSummary:\nPrerequisites:\nReproduction (non-destructive):\nExpected result:\nObserved result:\nSanitized evidence:\nImpact:\nSuggested fix:\nDisclosure timeline:"));
const asn=command("asn","Public ASN lookup guidance",ctx=>say(ctx,"ASN LOOKUP","For public ASN and organization records, see https://bgp.he.net/ or https://stat.ripe.net/\nQuery: "+limit(arg(ctx)||"not supplied",160)));
const cybermenu=command("cybermenu","List DACREATOR DAEMON cybersecurity commands",ctx=>say(ctx,"𝗖𝗬𝗕𝗘𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦","*Passive audits*\n.headers URL  .cors URL  .csp URL\n*Recon guides*\n.scope .subdomain .wayback .params .js .endpoints .links .techstack\n*Assessment guides*\n.xss .sqli .lfi .ssrf .openredirect .idor .xxe .ssti\n*OSINT guides*\n.email .github .dork .leaks .asn\n*Utilities*\n.encode .payload .bypass .wordlist\n*Reporting*\n.report .cvss .severity .poc\n\nGuides do not execute exploits. HTTPS header checks are passive."));
export default [
 cybermenu,
 command("headers","Passive HTTPS security headers audit",ctx=>headerAudit(ctx,"headers")),
 command("cors","Passive CORS header review",ctx=>headerAudit(ctx,"cors")),
 command("csp","Passive CSP header review",ctx=>headerAudit(ctx,"csp")),
 ...checks,...guide,encode,cvss,severity,report,asn
];
