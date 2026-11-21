// commands/recon.js — recon + OSINT tools (ESM)
import https from "https";
import http from "http";

function get(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { rejectUnauthorized: false }, res => {
      let d = "";
      res.on("data", c => (d += c));
      res.on("end", () => {
        try { resolve(JSON.parse(d)); } catch { resolve(d); }
      });
    }).on("error", reject);
  });
}

function getHeaders(url) {
  return new Promise(resolve => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { rejectUnauthorized: false }, res => {
      resolve({ status: res.statusCode, headers: res.headers });
      res.destroy();
    });
    req.on("error", e => resolve({ error: e.message }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ error: "timeout" }); });
  });
}

// ── ip ───────────────────────────────────────────────────────────────────────
export const ip = {
  name: "ip",
  aliases: ["geoip", "ipinfo"],
  category: "Recon",
  description: "IP geolocation + ASN info. Usage: .ip <address>",
  run: async ctx => {
    const target = String(ctx.args || "").trim();
    if (!target) return ctx.reply("Usage: .ip <address>");
    try {
      const d = await get(`http://ip-api.com/json/${target}?fields=status,message,country,regionName,city,isp,org,as,lat,lon,reverse,query`);
      if (d.status === "fail") return ctx.reply(`❌ ${d.message}`);
      await ctx.reply(
        `🌐 *IP: ${d.query}*\n📍 ${d.city}, ${d.regionName}, ${d.country}\n🏢 ISP: ${d.isp}\n🏛 Org: ${d.org}\n🔢 AS: ${d.as}\n📡 rDNS: ${d.reverse || "none"}\n🗺 Coords: ${d.lat}, ${d.lon}`
      );
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── dns ──────────────────────────────────────────────────────────────────────
export const dns = {
  name: "dns",
  aliases: ["dnslookup", "resolve"],
  category: "Recon",
  description: "DNS lookup via Google JSON API. Usage: .dns <domain> [type]",
  run: async ctx => {
    const parts = String(ctx.args || "").trim().split(/\s+/);
    const domain = parts[0];
    const type = (parts[1] || "A").toUpperCase();
    if (!domain) return ctx.reply("Usage: .dns <domain> [A|MX|TXT|NS|CNAME|AAAA]");
    try {
      const d = await get(`https://dns.google/resolve?name=${domain}&type=${type}`);
      if (!d.Answer?.length) return ctx.reply(`No ${type} records for ${domain}`);
      const records = d.Answer.map(r => `  ${r.type} → ${r.data} (TTL ${r.TTL})`).join("\n");
      await ctx.reply(`🔍 *DNS ${type}: ${domain}*\n${records}`);
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── whois ─────────────────────────────────────────────────────────────────────
export const whois = {
  name: "whois",
  aliases: ["domaininfo"],
  category: "Recon",
  description: "WHOIS-style domain data via rdap.org. Usage: .whois <domain>",
  run: async ctx => {
    const domain = String(ctx.args || "").trim();
    if (!domain) return ctx.reply("Usage: .whois <domain>");
    try {
      const d = await get(`https://rdap.org/domain/${domain}`);
      const events = (d.events || []).reduce((acc, e) => {
        acc[e.eventAction] = e.eventDate?.split("T")[0] || "?";
        return acc;
      }, {});
      const ns = (d.nameservers || []).map(n => n.ldhName).join(", ");
      const status = (d.status || []).join(", ");
      await ctx.reply(
        `📋 *WHOIS: ${domain}*\nRegistered: ${events.registration || "?"}\nExpires: ${events.expiration || "?"}\nUpdated: ${events.lastChanged || "?"}\nNS: ${ns || "?"}\nStatus: ${status || "?"}`
      );
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── subdomains ────────────────────────────────────────────────────────────────
export const subdomains = {
  name: "subdomains",
  aliases: ["subdomain", "subenum"],
  category: "Recon",
  description: "Enumerate subdomains via crt.sh. Usage: .subdomains <domain>",
  run: async ctx => {
    const domain = String(ctx.args || "").trim();
    if (!domain) return ctx.reply("Usage: .subdomains <domain>");
    try {
      const d = await get(`https://crt.sh/?q=%.${domain}&output=json`);
      if (!Array.isArray(d) || !d.length) return ctx.reply(`No certs found for *.${domain}`);
      const unique = [...new Set(
        d.flatMap(c => c.name_value.split(/\n/))
          .map(s => s.trim().replace(/^\*\./, ""))
          .filter(s => s.endsWith(domain))
      )].sort();
      const preview = unique.slice(0, 30);
      await ctx.reply(
        `🔎 *Subdomains: ${domain}* (${unique.length} found)\n${preview.join("\n")}${unique.length > 30 ? `\n…+${unique.length - 30} more` : ""}`
      );
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── headers ───────────────────────────────────────────────────────────────────
export const headers = {
  name: "headers",
  aliases: ["httpheaders", "secheaders"],
  category: "Recon",
  description: "HTTP response headers + security header audit. Usage: .headers <url>",
  run: async ctx => {
    let url = String(ctx.args || "").trim();
    if (!url) return ctx.reply("Usage: .headers <url>");
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    try {
      const { status, headers: h, error } = await getHeaders(url);
      if (error) return ctx.reply(`Error: ${error}`);
      const SEC = ["content-security-policy","strict-transport-security","x-frame-options","x-xss-protection","x-content-type-options","referrer-policy","permissions-policy"];
      const secAudit = SEC.map(k => `${h[k] ? "✅" : "❌"} ${k}`).join("\n");
      const interesting = ["server","x-powered-by","x-generator","x-aspnet-version","cf-ray"].filter(k => h[k]).map(k => `  ${k}: ${h[k]}`).join("\n");
      await ctx.reply(`🔐 *Headers: ${url}*\nStatus: ${status}\n\n*Security:*\n${secAudit}${interesting ? `\n\n*Interesting:*\n${interesting}` : ""}`);
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── ssl ───────────────────────────────────────────────────────────────────────
export const ssl = {
  name: "ssl",
  aliases: ["cert", "tlscheck"],
  category: "Recon",
  description: "TLS certificate info. Usage: .ssl <domain>",
  run: async ctx => {
    const domain = String(ctx.args || "").trim();
    if (!domain) return ctx.reply("Usage: .ssl <domain>");
    try {
      const cert = await new Promise((resolve, reject) => {
        const req = https.get(`https://${domain}`, { rejectUnauthorized: false }, res => {
          const c = res.socket.getPeerCertificate();
          resolve(c);
          res.destroy();
        });
        req.on("error", reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error("timeout")); });
      });
      if (!cert?.subject) return ctx.reply(`No cert found for ${domain}`);
      const exp = new Date(cert.valid_to);
      const daysLeft = Math.floor((exp - Date.now()) / 86400000);
      await ctx.reply(
        `🔒 *TLS: ${domain}*\nCN: ${cert.subject.CN || "?"}\nIssuer: ${cert.issuer?.O || "?"}\nValid: ${cert.valid_from} → ${cert.valid_to}\nDays left: ${daysLeft} ${daysLeft < 30 ? "⚠️" : "✅"}\nSANs: ${cert.subjectaltname || "none"}`
      );
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── robots ────────────────────────────────────────────────────────────────────
export const robots = {
  name: "robots",
  aliases: ["robotstxt"],
  category: "Recon",
  description: "Fetch robots.txt. Usage: .robots <domain>",
  run: async ctx => {
    let url = String(ctx.args || "").trim();
    if (!url) return ctx.reply("Usage: .robots <domain>");
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    url = url.replace(/\/$/, "") + "/robots.txt";
    try {
      const d = await get(url);
      const text = typeof d === "string" ? d : JSON.stringify(d);
      await ctx.reply(`🤖 *robots.txt: ${url}*\n\`\`\`\n${text.slice(0, 2000)}\n\`\`\``);
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── wayback ───────────────────────────────────────────────────────────────────
export const wayback = {
  name: "wayback",
  aliases: ["archive"],
  category: "Recon",
  description: "Wayback Machine availability. Usage: .wayback <url>",
  run: async ctx => {
    let url = String(ctx.args || "").trim();
    if (!url) return ctx.reply("Usage: .wayback <url>");
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    try {
      const d = await get(`http://archive.org/wayback/available?url=${encodeURIComponent(url)}`);
      const snap = d.archived_snapshots?.closest;
      if (!snap?.available) return ctx.reply(`No snapshot found for ${url}`);
      await ctx.reply(`📼 *Wayback: ${url}*\nStatus: ${snap.status}\nTimestamp: ${snap.timestamp}\nURL: ${snap.url}`);
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── mx ────────────────────────────────────────────────────────────────────────
export const mx = {
  name: "mx",
  aliases: ["mailservers"],
  category: "Recon",
  description: "MX record lookup. Usage: .mx <domain>",
  run: async ctx => {
    const domain = String(ctx.args || "").trim();
    if (!domain) return ctx.reply("Usage: .mx <domain>");
    try {
      const d = await get(`https://dns.google/resolve?name=${domain}&type=MX`);
      if (!d.Answer?.length) return ctx.reply(`No MX records for ${domain}`);
      const records = d.Answer.map(r => `  ${r.data}`).join("\n");
      await ctx.reply(`📧 *MX: ${domain}*\n${records}`);
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── spf ───────────────────────────────────────────────────────────────────────
export const spf = {
  name: "spf",
  aliases: ["emailsec"],
  category: "Recon",
  description: "SPF + DMARC + DKIM check. Usage: .spf <domain>",
  run: async ctx => {
    const domain = String(ctx.args || "").trim();
    if (!domain) return ctx.reply("Usage: .spf <domain>");
    try {
      const [spfData, dmarcData] = await Promise.all([
        get(`https://dns.google/resolve?name=${domain}&type=TXT`),
        get(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`)
      ]);
      const spfRec = (spfData.Answer || []).map(r => r.data).find(r => r.includes("v=spf1")) || "❌ No SPF";
      const dmarcRec = (dmarcData.Answer || []).map(r => r.data).find(r => r.includes("v=DMARC1")) || "❌ No DMARC";
      await ctx.reply(`📮 *Email security: ${domain}*\nSPF: ${spfRec}\nDMARC: ${dmarcRec}`);
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── github ────────────────────────────────────────────────────────────────────
export const github = {
  name: "github",
  aliases: ["ghosint", "ghrecon"],
  category: "Recon",
  description: "GitHub user OSINT. Usage: .github <username>",
  run: async ctx => {
    const user = String(ctx.args || "").trim();
    if (!user) return ctx.reply("Usage: .github <username>");
    try {
      const d = await get(`https://api.github.com/users/${user}`);
      if (d.message) return ctx.reply(`❌ ${d.message}`);
      const repos = await get(`https://api.github.com/users/${user}/repos?per_page=5&sort=updated`);
      const repoList = Array.isArray(repos) ? repos.map(r => `  • ${r.name} ⭐${r.stargazers_count}`).join("\n") : "";
      await ctx.reply(
        `👤 *GitHub: ${user}*\nName: ${d.name || "?"}\nBio: ${d.bio || "?"}\nLocation: ${d.location || "?"}\nCompany: ${d.company || "?"}\nEmail: ${d.email || "?"}\nFollowers: ${d.followers} | Following: ${d.following}\nPublic repos: ${d.public_repos}\nCreated: ${d.created_at?.split("T")[0]}\n\n*Recent repos:*\n${repoList}`
      );
    } catch (e) { await ctx.reply(`Failed: ${e.message}`); }
  }
};

// ── breach ────────────────────────────────────────────────────────────────────
export const breach = {
  name: "breach",
  aliases: ["haveibeenpwned", "hibp"],
  category: "Recon",
  description: "Check email in public breach data. Usage: .breach <email>",
  run: async ctx => {
    const email = String(ctx.args || "").trim();
    if (!email || !email.includes("@")) return ctx.reply("Usage: .breach <email>");
    try {
      const d = await get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`);
      if (!Array.isArray(d) || !d.length) return ctx.reply(`✅ ${email} — not found in known breaches.`);
      const names = d.map(b => b.Name).join(", ");
      const count = d.length;
      await ctx.reply(`⚠️ *${email} found in ${count} breach(es):*\n${names}\n\n_Source: HaveIBeenPwned_`);
    } catch (e) {
      if (e.message?.includes("404")) return ctx.reply(`✅ ${email} — not found in known breaches.`);
      await ctx.reply(`Failed: ${e.message}`);
    }
  }
};

export default { ip, dns, whois, subdomains, headers, ssl, robots, wayback, mx, spf, github, breach };
