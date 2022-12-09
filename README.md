# Guided Generation of Code to Control a Minecraft Bot

This project is built on Microsoft's Minecraft bot https://github.com/microsoft/interactive-minecraft-npcs. The Microsoft project contained code referred in:

<a href="https://wordplay-workshop.github.io/modern/assets/pdfs/6.pdf">Craft an Iron Sword: Dynamically Generating Interactive Game Characters by Prompting Large Language Models Tuned on Code</a><br/>

```bibtex
@inproceedings{volum2022craft,
  title={Craft an Iron Sword: Dynamically Generating Interactive Game Characters by Prompting Large Language Models Tuned on Code},
  author={Volum, Ryan and Rao, Sudha and Xu, Michael and DesGarennes, Gabriel A and Brockett, Chris and Van Durme, Benjamin and Deng, Olivia and Malhotra, Akanksha and Dolan, Bill},
  booktitle={The Third Wordplay: When Language Meets Games Workshop},
  year={2022}
}
```

## Getting Started

The original Microsoft work used few-shot learning on Codex (GPT-3 fine-tuned on github code) to control the minecraft bot. Codex would sometimes generate invalid functions because it had no way of knowing the names of all valid functions in Mineflayer. So we added an iterative approach to fix this.

### Requirements

To run this prototype, you'll need the following: 

1. **Minecraft** - specifically the Java version v.1.17.1
1. **Node.js and npm** - the prototype was tested with Node version v14.17.5
1. **Access to the OpenAI Codex API** - this prototype specifically uses the `code-davinci-002` model
1. **git** - if you're reading this, this is probably self evident :)

### Running the prototype

1. Clone the repo: `git clone https://github.com/microsoft/codex-gaming.git`
1. Install npm packages: `npm i`
1. Rename `.env.example` to `.env`
1. Grab your Codex API key from `https://beta.openai.com/account/api-keys` and add it to the `.env` file
1. Open Minecraft and create a one player new world. Set "Allow Cheats" to true
1. Enter the world and open settings (hitting the escape key). Select "Open to LAN", selecting "Allow Cheats" again. To avoid being killed in-game while programming, set mode to "Creative"
1. Run the bot: `node index.js`. To automatically re-run the bot as you make code changes, consider installing `nodemon` and running `nodemon index.js`
1. You can see the code produced by the bot in the console window 

You should now see an NPC appear that you can interact with! To type commands or messages to the NPC, press "t" to open the chat window, and type the command or message. 

## How it Works

The context directory contains some examples of natural instructions and corresponding code to help Codex understand the syntax of the code it needs to generate. We apply an iterative method to parse the code and modify invalid functions. After correcting the first invalid function, we call Codex again to generate the remaining part after the function name. This process is repeated.

```js
// "Go backwards"
bot.setControlState('back', true)

// "Hello!"
bot.chat("Yo! How's it going?");
```

As you can see, we give commands in the form of comments, which is followed by the code that should be executed to satisfy the command. When calling the model, we can now simply pass a comment with our command (e.g. `// "Go Forward"`) and the model will generate the next line - the code that satisfies the command (e.g. `bot.setControlState('forward', true)`). In the `index.js`, we run the code by simply calling JavaScript's "eval" function on it. 

