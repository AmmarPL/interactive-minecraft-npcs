require("dotenv").config();
const { recordInteraction, recordEvent, recordException } = require("./Log");
const mineflayer = require("mineflayer");
const mineflayerViewer = require("prismarine-viewer").mineflayer;
let Context = require("./Context");
let Model = require("./Model");
const commands = require("./context/main-prompt");

// Global code (to be used by the bot itself). Note that this code is included in the context so that the bot is aware of its existence.

let target = null;
let result = null;
let _DEBUG = process.env.DEBUG === "true";
let bot = null;
let no_request = 0
let prompt_no = 0

const mainState = require("./utils/GlobalContext");

let fs = require('fs');

fs.writeFile('logs.txt', "", function (err) {
  // if (err) return console.log(err);
  console.log('');
});

const {
  registerPathfindingSkill,
  goToPlayer,
  locateBlock,
  mineBlock,
  craftItem,
  equipItem,
  isInInventory,
  getCount,
  listItems,
  getIngredients,
  createQueryPrompt,
  dropItem,
  placeItem,
  depositItemIntoChest,
  getItemFromChest,
  listItemsInChest,
  openChest,
  closeChest,
} = require("./skillsLoader");


const context = new Context(commands);
const model = new Model();


if (_DEBUG) {
  // automatically listen for and connect to local lan worlds
  const dgram = require('dgram')
  const s = dgram.createSocket('udp4');
  s.bind(4445, () => {
    console.log("Listening on port 4445");
    s.addMembership('224.0.2.60');
  });

  s.on('message', function (message, remote) {
    if (bot) return;
    console.log('MCast Msg: From: ' + remote.address + ':' + remote.port + ' - ' + message);
    if (message.includes("[AD]")) {
      const port = message.toString().match(/\[AD\](\d*)\[\/AD\]/)[1];
      console.log("Joining server found on port: " + port);
      connect(port)
    }
  });
} else {
  connect()
}

function _throw(m) {
  throw new Error(m);
}

function _log (m) {
  recordEvent("log", bot.username, m);
  if (_DEBUG) bot.chat(m);
  else console.log(m);
}

async function watchTarget() {
  if (!target) return false;
  await bot.lookAt(target.position.offset(0, target.height, 0));
  return true;
}
function connect (port = process.env.PORT) {
  bot = mineflayer.createBot({
    host: process.env.IP ?? "localhost", // minecraft server ip
    port: port ?? 25565, // minecraft server port
    username: process.env.MC_USERNAME ? process.env.MC_USERNAME : "boop_bot", // minecraft username
    ...(process.env.PASSWORD && { password: process.env.PASSWORD }),
    ...(process.env.AUTH && { auth: process.env.AUTH }),
  });
  // Event subscriptions
  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;
    recordEvent("chat", username, message);
    const lcMessage = message.toLowerCase();

    if (lcMessage.startsWith("reset")) {
      recordEvent("reset", username, message);
      context.resetContext();
      bot.pathfinder.stop();
      bot.chat("I'm refreshed now!");
      return;
    }

    if (username.startsWith("~") || !bot.players.hasOwnProperty(username)) {
      if (lcMessage.startsWith("debug")) {
        recordEvent("debug", username, message);
        _DEBUG = !_DEBUG;
        bot.chat(`Debug mode ${ _DEBUG ? "enabled" : "disabled" }`);
      }
      return;
    }

    let completion;
    target = bot.players[username].entity;

    if (lcMessage.startsWith("help")) {
      watchTarget();
      bot.chat("Oh no! You're caught in a cobweb. How can I help?");
      return;
    }

    if (lcMessage.startsWith("script: ")) {
      recordEvent("script", username, message);
      await evaluateCode(message.substring(8));
      return;
    }

    if (lcMessage.startsWith("unlearn")) {
      recordEvent("unlearn", username, message);
      context.removeLastInteraction();
      bot.chat("I unlearned our last interaction!");
      return;
    }

    if (lcMessage.startsWith("fix: ")) {
      recordEvent("fix", username, message);
      context.fixResponse(message.substring(5));
      bot.chat("Thanks for the feedback! I've now learned the right response");
      return;
    }

    if (lcMessage.startsWith("try again")) {
      recordEvent("tryAgain", username, message);
      completion = model.getNextCompletion();
      if (completion) {
        recordInteraction(
          "completion",
          username,
          context.interactions[context.interactions.length - 1].split("\n")[0].split("// ")[1],
          completion
        );
        context.fixResponse(completion);
        await evaluateCode(completion);
      } else {
        bot.chat("I'm all out of attempts!"); 
      }
      return;
    } 
 
    // mainState.resetPrompt()
    const prompt = context.craftPrompt(message);
    const promptMain = mainState.craftPrompt(message);

    mainState.prompt += `// ${message}\n`
    prompt_no += 1

    let query = ''  
    let first_inference = false
    let check_mcr = false
    if(check_mcr){
      let { generatedCode, tok, logprobs } = await model.getCompletion(mainState.prompt);
      completion = generatedCode
      console.log(typeof(completion), completion)    
      }
else{

  
  try {

    exec = true
    // iteratively loop till generated code runs out of functions i.e, parseCode function returning false 
    while(exec == true){
      no_request += 1
      let { generatedCode, tok, logprobs } = await model.getCompletion(mainState.prompt);

      if (!first_inference){
        fs = require('fs');
        fs.writeFile('fist_inference.txt', generatedCode, function (err) {
          if (err) return console.log(err);
          console.log('First Inference Logged');
        });
        first_inference = true
      }
      let flag = mainState.parseCode(tok, generatedCode)
      if(flag == false){
        exec = false;
        mainState.addToPrompt(`${generatedCode}`)
        mainState.parsedCode += `${generatedCode}`
        query += generatedCode
        fs = require('fs');
        fs.writeFile('query.txt', query, function (err) {
          if (err) return console.log(err);
          console.log('Inference Logged');
        });
        break; 
      } 
      console.log({flag})
      mainState.addToPrompt(`${flag[3]}`)
      mainState.parsedCode += `${flag[3]}`
      query += flag[3] 
      let lp = logprobs[flag[0]]
      if (flag[1] != flag[2]){
        lp[flag[2]] = lp[flag[1]]
        delete lp[flag[1]]
      }


      let topSelected = (await mainState.topPrune(lp)).tokenSelected
      if(topSelected == undefined){
        console.log("Undefined Topselected")
      }
      mainState.addToPrompt(`${topSelected}(`) 
      mainState.parsedCode += `${topSelected}(`
      query += `${topSelected}(`
      fs = require('fs');
      let log = {
        predictedTokenFromCODEX: flag[1],
        tokenAfterCorrection: topSelected,
        didChange: flag[1] == topSelected,
        queryNumber: no_request,
        currentPrompt: flag[1] == topSelected ? "" : mainState.prompt
      }
      fs.appendFile('./logs.txt', `Prompt No: ${prompt_no} - Iteration No: ${no_request} - ${JSON.stringify(log)}\n`, function (err) {
        if (err) return console.log(err);
        console.log('Inference Logged');
        console.log(log);
      });
    }
    
    
    fs = require('fs');
    fs.writeFile('helloworld.txt', mainState.prompt, function (err) {
      // if (err) return console.log(err);
      console.log('Hello World > helloworld.txt');
    });
    
    
    console.log(`Query is: ${query}`)
    completion = query
  } catch (err) {
    recordException(err);
    console.log("Error calling Codex", err);
    
    // if err string contains 400
    if (err.message.includes("400")) {
      bot.chat(
        "I had to reset my brain and might have forgotten some context. Sorry about that!"
        );
        recordEvent("reset", username, message);
        mainState.resetContext();
        context.resetContext();
      }
      return;
    }
    
  }
    console.log({no_request})
    
    if (completion) {
      // Automatically append this interaction to the context
      recordInteraction("completion", username, message, completion);
      context.addInteraction(message, completion);
      await evaluateCode(completion);
    }

    async function evaluateCode (code, recursive = false) {
      // Echo the code produced for players to see it. Don't echo when the bot code is already producing dialog or it will double echo
      try {
        const mcode = code;
      if (code && !code.startsWith("bot.chat")) {
        // Echo the first 9 lines of code. Any more can result in the bot being expelled from the server for spamming
        const lines = code?.split("\n"); 
        const firstNine = lines.slice(0, 9).join("\n");
        console.log({ firstNine, code: "(async () => {return " + code + "})()" })
        _log(firstNine);
      }
        // await eval("(async () => {return " + code + "})()").catch((err) => handleError(err));
        await eval(`${mcode}`)
        // await eval("locateBlock(bot, 'rail', 0)\n" +
        // `.then(success => success ? bot.mount(bot.nearestEntity((entity) => { return entity.name === 'minecart' })) : _throw("I couldn't find the rail!"))\n` +
        // '\n')
        if (recursive) {
          bot.chat(result);
          recordInteraction("completion", bot.username, "Response: " + result, "", true);
          context.addInteraction("Response: " + result, "\n");
        }
        return true;
      } catch (err) {
        handleError(err);
        return false;
      } 
    }

    function handleError (err) {
      recordException(err);
      console.log("Error evaluating code:", err);
      bot.chat(err.message); 
      if (err.name !== "Error") {
        context.removeLastInteraction();
        bot.chat("I unlearned our last interaction!");
      }
    }
  });

  bot.once("spawn", () => {
    registerPathfindingSkill(bot);
    recordEvent("spawn", bot.username);
    bot.chat("hello world!");
    mineflayerViewer(bot, {
      port: 3030,
      firstPerson: false,
    });
  });

  bot.on("mount", () => {
    bot.chat(`mounted ${ bot.vehicle.objectType }`);
  });

  bot.on("dismount", (vehicle) => {
    bot.chat(`dismounted ${ vehicle.objectType }`);
  });
  function onDisconnect (message) {
    bot.viewer.close()
    console.log(message)
    bot = null
  }
  bot.on("kicked", onDisconnect)
  bot.on("error", onDisconnect)
}