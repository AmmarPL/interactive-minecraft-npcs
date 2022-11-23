const commands = require("../context/main-prompt")

class GlobalContext{
    constructor(prompt){
        this.parsedCode = ""
        this.prompt = prompt
        this.initPrompt = prompt
        this.currentPrompt = ""
        this.logProbs = {
            "chat": -0.006077764,
            "clear": -8.295856,
            "on": -5.9480543,
            "set": -6.999204,
            "ch": -8.397043
        }
        this.semantic_scores = []

        this.finalScores = {}

        this.functionSet = [
            "registerPathfindingSkill",
            "goToPlayer",
            "locateBlock",
            "mineBlock",
            "craftItem",
            "equipItem",
            "isInInventory",
            "getCount",
            "listItems",
            "getIngredients",
            "createQueryPrompt",
            "dropItem",
            "placeItem",
            "depositItemIntoChest",
            "getItemFromChest",
            "listItemsInChest",
            "openChest",
            "closeChest",
            "chat",
            "setControlState",
            "clearControlStates",
            "clearInterval",
            "watchInterval",
            "clearControlStates",
            "setInterval",
            "getCompletion",
            "evaluateCode",
            "getCompletion",
            "then",
            "_throw"
        ]
    }


    craftPrompt(input) {
        this.lastInput = input;
        return `${this.prompt}// ${input}\n`;
      }


    addToPrompt(term) {
        this.prompt += term; 
    }

    resetContext(){
        this.prompt = this.initPrompt;
    }

    parseCode(tokens,generation){
            let token = ""
            var start =-1
            var end =-1
            for (let i = 1; i < generation.length; i++) {
                if (generation[i] == '(' && (i >=4 || generation.slice(i-4,i) != "then" || generation.slice(i-5,i) != "throw")){
                    var j=i
                    for(j =i;j>-1;j--){
                        if (j==-1 || generation[j] == "." || generation[j]==" " || generation[j]=="\n"){
                            break
                        }
                    }
                    start = j+1
                    end = i
                    break
                    //i is paranthesis index
                }
            }
            for (let i = end-1; i >=start ; i--){
                console.log(generation.slice(i,end))
                console.log(start,end)
                for (let j =0; j< tokens.length; j++){
                    if (tokens[j] == generation.slice(i,end)){
                        return [j,tokens[j],generation.slice(start,end), generation.slice(0,start)]
                    }
                }
                
            }
            return false;
    }
    
    resetPrompt() {
        this.prompt = this.initPrompt;
    }
    async SemanticSearch(data) {
        try{

            const response = await fetch(
                "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2",
                {
                    headers: { Authorization: "Bearer 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" },
                    method: "POST",
                    body: JSON.stringify(data),
                }
                );
                const result = await response.json();
                // console.log(data.inputs.sentences)
                // console.log(result)
                // console.log(result.indexOf(Math.max(...result)))
                return { input_token: data.inputs.source_sentence, token: data.inputs.sentences[result.indexOf(Math.max(...result))], semantic_similarity_score: Math.max(...result)};
            }
        catch(err){
            return { input_token: "", token: "", semantic_similarity_score: 0}
        }
    }

    async runSemanticSearch(){
        let res = []
        for (let a of Object.keys(this.logProbs)){
            // this.logProbs[a]
            res.push(
                this.SemanticSearch({"inputs": {
                "source_sentence": a,
                "sentences": this.functionSet
            }}).then((response) => {
                console.log('response')
                console.log(response)
                return response
            })
                    )         
        }
        await Promise.all(res).then((arr) =>{
            this.semantic_scores = arr;
        })
    }

    async topPrune(logProbs){
        if (logProbs)  this.logProbs = logProbs
        await this.runSemanticSearch()
        let token = [], values = []
        for(let i of this.semantic_scores){
            token.push(i.token)
            values.push(i.semantic_similarity_score * Math.exp(this.logProbs[i.input_token]))
            this.finalScores[i.token] = i.semantic_similarity_score * Math.exp(this.logProbs[i.input_token])
        }
        console.log(this.finalScores)
        let ret = { tokenSelected: token[values.indexOf(Math.max(...values))], value: Math.max(...values) }
        console.log(ret)
        return { tokenSelected: token[values.indexOf(Math.max(...values))], value: Math.max(...values) }
    }
}
const mainState = new GlobalContext(commands);
mainState.topPrune()


let tok = [
    '\n',   'go',        'To',       'Player',
    '(',    'bot',       ',',        ' 3',
    ',',    ' username', ')',        '\n',
    '.',    'then',      '(',        'success',
    ' =>',  ' success',  ' ?',       ' bot',
    '.',    'chat',      '("',       'I',
    "'m",   ' here',     '!"',       ')',
    ' :',   ' _',        'throw',    '("',
    'I',    ' couldn',   "'t",       ' get',
    ' to',  ' you',      '!"',       '))',
    '\n',   '\n',        '//',       ' what',
    ' are', ' you',      ' holding'
  ]

let sampleCode = `goToPlayer(bot, 3, username)
.then(success => success ? bot.chat("I'm here!") : _throw("I couldn't get to you!"))`

console.log("Hey" + mainState.parseCode(tok, sampleCode))



module.exports = mainState;