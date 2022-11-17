class GlobalContext{
    constructor(){
        this.parsedCode = ""
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
            "getCompletion"

        ]
    }

    parseCode(generation){
            for (let i = 0; i < generation.length; i++) {
                if (generation[i] == '(' && (i >=4 || generation.slice(i-4,i) != "then")){
                    var j=i
                    for(j =i;j>-1;j--){
                        if (j==-1 || generation[j] == "." || generation[j]==" " || generation[j]=="\n"){
                            break
                        }
                    }
                    //i is paranthesis index
                    return [j+1,i]
                }
            }
            return false;
    }
    

    async SemanticSearch(data) {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2",
            {
                headers: { Authorization: "Bearer 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" },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        const result = await response.json();
        return { input_token: data.inputs.source_sentence, token: data.inputs.sentences[result.indexOf(Math.max(...result))], semantic_similarity_score: Math.max(...result)};
    
    }

    async runSemanticSearch(){
        let res = []
        for (let a of Object.keys(this.logProbs)){
            this.logProbs[a]
            res.push(
                this.SemanticSearch({"inputs": {
                "source_sentence": a,
                "sentences": this.functionSet
            }}).then((response) => {
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
            token.push(i.input_token)
            values.push(i.semantic_similarity_score * Math.exp(this.logProbs[i.input_token]))
            this.finalScores[i.input_token] = i.semantic_similarity_score * Math.exp(this.logProbs[i.input_token])
        }
        console.log(this.finalScores)
        let ret = { tokenSelected: token[values.indexOf(Math.max(...values))], value: Math.max(...values) }
        console.log(ret)
        return { tokenSelected: token[values.indexOf(Math.max(...values))], value: Math.max(...values) }
    }
}
const mainState = new GlobalContext();
mainState.topPrune()


module.exports = mainState;