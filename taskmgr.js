#!"C:/Program Files/nodejs/node.exe"
/*eslint-env node*/

const cgi = (process.env.GATEWAY_INTERFACE != undefined);

const http = cgi ? null : require("http");
// import * as http from "http";
const os = require('os');
// import * as os from "os";

async function getInfo() {
  // 基準点
  const baseLoad = [];
  const cpus = os.cpus();
  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i];
    baseLoad.push(cpu.times);
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const cpus2 = os.cpus();
      const loads = [];

      // Coreごと
      for (let i = 0; i < cpus2.length; i++) {
        const cpu = cpus2[i];

        // 合計
        let totalLoadDiff = 0;
        for (const key in cpu.times) {
          totalLoadDiff += (cpu.times[key] - baseLoad[i][key]);
        }
        //raw->%
        const load = {
          model: cpu.model,
          speed: cpu.speed
        };
        for (const key in cpu.times) {
          load[key] = (cpu.times[key] - baseLoad[i][key]) / totalLoadDiff * 100;
        }
        // 配列に追加
        loads.push(load);
      }
      resolve({
        cpus: loads,
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),   //. 1, 5, and 15 min's load avg
        timestamp: (new Date()).getTime()
      });
    }, 500);
  });
}

if (cgi) {
  process.stdout.write("Content-Type: application/json; charset=UTF-8\n\n");
  getInfo()
  .then((value) => {
    process.stdout.write(JSON.stringify(value));
  });
} else {
  const server = http.createServer(async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*"
    });
    // res.end(JSON.stringify(getInfo()));
    res.end(JSON.stringify(await getInfo()));
  });
  server.listen(8080);
}
