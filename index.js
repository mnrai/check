var cron = require("node-cron");
var fetch = require("node-fetch");
const commandLineArgs = require("command-line-args");
const { exec } = require("child_process");
const optionDefinitions = [
  { name: "ips", alias: "p", type:String, multiple:true  },
];

const options = commandLineArgs(optionDefinitions);
const ipAddresses = [...options.ips, "staging.nobunaga.opentensor.ai"];
let currentlyUsed = options.ips[0];
const fn = async () => {
    for (let i = 0; i<ipAddresses.length; i++) {
        try {
            const response = await fetch(`http://${ipAddresses[i]}:9933/health`);
            const data = await response.json();
            if (data.isSyncing !== false) {
                throw new Error("Cannot connect to "+ ipAddresses[i])
            }

            if(ipAddresses[i] !== currentlyUsed) {
                exec(
                  `pm2 monitor all | awk '$2 != "id" && $2 > -1 { print "pm2 info "$2" | grep \"│ name              │\""}' | bash - | awk ' { print $4}' | awk '{ print "pm2 info "$1" | grep \"script args\"  | sed \"s/│ script args       │ /pm2 delete "$1"; pm2 start \/root\/.bittensor\/bittensor\/bittensor\/_neuron\/text\/core_server\/main.py --name "$1" --time --interpreter python3 -- /g\" | sed \"s/ │//g\""}' | bash - | sed "s/${currentlyUsed}/${ipAddresses[i]}/g" | bash -`,
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