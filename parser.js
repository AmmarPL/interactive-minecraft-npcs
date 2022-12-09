function parseCode(tokens,generation){
    let token = ""
    var start =-1
    var end =-1
    for (let i = 1; i < generation.length; i++) {
        if (generation[i] == '(' && (i >=4 &&(generation.slice(i-1,i)!= "(" && generation.slice(i-4,i) != "then" && generation.slice(i-5,i) != "throw"))){
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
    // for (let i = end-1; i >=start ; i--){
    //     console.log(generation.slice(i,end))
    //     console.log(start,end)
    //     for (let j =0; j< this.fun   ctionSet.length; j++){
    //         if (this.functionSet[j] == generation.slice(i,end)){
    //             return [j,this.functionSet[j],generation.slice(start,end), generation.slice(0,start)]
    //         }
    //     }
        
    // }
    for (let i = end-1; i >=start ; i--){
        // console.log(generation.slice(i,end))
        // console.log(start,end)
        for (let j =0; j< tokens.length; j++){
            if (tokens[j] == generation.slice(i,end)){
                return [j,tokens[j],generation.slice(start,end), generation.slice(0,start)]
            }
        }
        
    }
    return false;
}


let pc = parseCode(['(','()', ' ', '=>', ' {'], `(() => {
    bot.clearControlStates();
    bot.setControlState('back', true);
    setTimeout(() => {
        bot.clearControlStates();
    }, 1000);
}, 1000);
`)

console.log(pc)