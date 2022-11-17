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
        Promise.all(res).then((arr) =>{
            console.log(arr)
        })
    }
}
const mainState = new GlobalContext();

mainState.runSemanticSearch()

module.exports = mainState;