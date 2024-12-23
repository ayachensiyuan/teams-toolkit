// send a http request to localhost:8897
const http = require("http");

const options = {
  hostname: "localhost",
  port: 8897,
  path: "/proxy/stopproxy",
  method: "POST",
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:", data);
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
