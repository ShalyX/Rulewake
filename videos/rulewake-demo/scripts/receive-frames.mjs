import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("renders", "frames");
fs.mkdirSync(outputDir, { recursive: true });

let written = 0;
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET" && req.url === "/status") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ written, outputDir }));
    return;
  }

  const match = req.method === "POST" && req.url?.match(/^\/frame\/(\d+)$/);
  if (!match) {
    res.statusCode = 404;
    res.end("not found");
    return;
  }

  const chunks = [];
  let size = 0;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > 12 * 1024 * 1024) req.destroy();
    else chunks.push(chunk);
  });
  req.on("end", () => {
    const index = Number(match[1]);
    const filename = `frame-${String(index).padStart(4, "0")}.png`;
    fs.writeFileSync(path.join(outputDir, filename), Buffer.concat(chunks));
    written += 1;
    res.end("ok");
  });
});

server.listen(39177, "127.0.0.1", () => {
  process.stdout.write(`frame receiver ready: ${outputDir}\n`);
});
