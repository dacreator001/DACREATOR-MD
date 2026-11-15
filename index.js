import "dotenv/config";

if (process.env.PAIRING_NUMBERS) {
  import("./hosted.js").catch(error => {
    console.error("DACREATOR-MD hosted startup failed:", error?.stack || error);
    process.exitCode = 1;
  });
} else {
  import("./local.js").then(({ runLocalTerminal }) => runLocalTerminal()).catch(error => {
    console.error("DACREATOR-MD startup failed:", error?.stack || error);
    process.exitCode = 1;
  });
}
