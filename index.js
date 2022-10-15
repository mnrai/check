var cron = require("node-cron");
var fetch = require("node-fetch");
const commandLineArgs = require("command-line-args");
const { exec } = require("child_process");
const optionDefinitions = [
  { name: "ips", alias: "p", type:String, multiple:true  },
];

const options = commandLineArgs(optionDefinitions);
const ipAddresses = [
  ...options.ips,
  "AtreusLB-2c6154f73e6429a9.elb.us-east-2.amazonaws.com",
];
let currentlyUsed = options.ips[0];

const fn = async () => {
    for (let i = 0; i<ipAddresses.length; i++) {
        try {
            console.log({ t1: i !== ipAddresses.length - 1 });

            if(i !== ipAddresses.length -1) {
              const response = await fetch(`http://${ipAddresses[i]}:9933/health`);
              const data = await response.json();
              if (data.isSyncing !== false) {
                  throw new Error("Cannot connect to "+ ipAddresses[i])
              }
            }
            console.log({test1: ipAddresses[i]})
            console.log({ test2: ipAddresses[i] !== currentlyUsed });
            console.log({ test2: ipAddresses[i] !== currentlyUsed });
            if(ipAddresses[i] !== currentlyUsed) {
                exec(
                  `pm2 monitor all | awk '$2 != "id" && $2 > -1 { print "pm2 info "$2" | grep \"│ name              │\""}' | bash - | awk ' { print $4}' | awk '$1 != "index" { print "pm2 info "$1" | grep \"script args\" | grep \"core_server\" | sed \"s/│ script args       │ /pm2 delete "$1"; pm2 start \/root\/.bittensor\/bittensor\/bittensor\/_neuron\/text\/core_server\/main.py --name "$1" --time --interpreter python3 -- /g\" | sed \"s/ │//g\""}' | bash - | sed "s/[a-zA-Z0-9.]*:9944/${ipAddresses[i]}:9944/g" | bash -`,
                  (err, stout, stderr) => {
                    if (err) {
                      console.log(err);
                    }
                    console.log(stout);
                  }
                );
            }
            currentlyUsed = ipAddresses[i];
            return;
        } catch (e) {
            console.log(e)
        }
    }
};

cron.schedule(`*/5 * * * *`,fn)


fn()