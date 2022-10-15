var cron = require("node-cron");
var fetch = require("node-fetch");
const commandLineArgs = require("command-line-args");
const { exec } = require("child_process");
const optionDefinitions = [
  { name: "ips", alias: "p", type: String, multiple: true },
  { name: "telegram_group_id", type: String },
  { name: "telegram_bot_token", type: String },
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

            if(i !== ipAddresses.length -1) {
              const response = await fetch(`http://${ipAddresses[i]}:9933/health`);
              const data = await response.json();
              if (data.isSyncing !== false) {
                try {let telegram_group_id = options?.telegram_group_id;
                let telegram_bot_token = options?.telegram_bot_token;
                if(telegram_group_id && telegram_bot_token){
                   exec(
                     `curl --data chat_id="${telegram_group_id}" --data-urlencode "text=Subtensor (${ipAddresses[i]}) currently seems to be ${data.isSyncing ? "syncing": "not available"}" https://api.telegram.org/bot${telegram_bot_token}/sendMessage`,
                     (err, stout, stderr) => {
                       if (err) {
                         console.log(err);
                       }
                       // console.log({stout})
                     }
                   );
                }
               }catch(e) {

                }
                  throw new Error("Cannot connect to "+ ipAddresses[i])

              }
            }
    
            if(ipAddresses[i] !== currentlyUsed) {
              console.log(
                `pm2 monitor all | awk '$2 != "id" && $2 > -1 { print "pm2 info "$2" | grep \\"│ name              │\\""}' | bash - | awk ' { print $4}' | awk '$1 != "index" { print "pm2 info "$1" | grep \\"script args\\" | grep \\"model_name\\" | sed \\"s/│ script args       │ /pm2 delete "$1"; pm2 start \\/root\\/.bittensor\\/bittensor\\/bittensor\\/_neuron\\/text\\/core_server\\/main.py --name "$1" --time --interpreter python3 -- /g\\" | sed \\"s/ │//g\\""}' | bash - | sed "s/[a-zA-Z0-9.]*:9944/${ipAddresses[i]}:9944/g" | bash -`
              );
                exec(
                  `pm2 monitor all | awk '$2 != "id" && $2 > -1 { print "pm2 info "$2" | grep \\"│ name              │\\""}' | bash - | awk ' { print $4}' | awk '$1 != "index" { print "pm2 info "$1" | grep \\"script args\\" | grep \\"model_name\\" | sed \\"s/│ script args       │ /pm2 delete "$1"; pm2 start \\/root\\/.bittensor\\/bittensor\\/bittensor\\/_neuron\\/text\\/core_server\\/main.py --name "$1" --time --interpreter python3 -- /g\\" | sed \\"s/ │//g\\""}' | bash - | sed "s/[a-zA-Z0-9.]*:9944/${ipAddresses[i]}:9944/g" | bash -`,
                  (err, stout, stderr) => {
                    if (err) {
                      console.log({err});
                    }
                    console.log({stout, stderr, err});
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