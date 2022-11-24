const fetch = require('isomorphic-fetch');

// Model Class

class Model {
  constructor() {
    this.completions = [];
    this.count = 0
    this.API_KEYS = [process.env.CODEX_API_KEY, process.env.CODEX_API_KEY_2]
  }
  async getCompletion(prompt) {
    this.count += 1
    const response = await fetch(
      'https://api.openai.com/v1/engines/code-davinci-002/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ` Bearer ${this.API_KEYS[this.count % 2]}`
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 300,
          temperature: 0,
          stop: "//",
          n: 1,
          logprobs: 5
        })
      }
    );

    // catch errors
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    // console.log(json.choices[0].logprobs.tokens)
    // console.log(json.choices[0].logprobs.top_logprobs)

    this.completions = json.choices.map(choice => choice.text);
    this.removeDuplicateCompletions();
    return { generatedCode: this.getNextCompletion(), tok: json.choices[0].logprobs.tokens, logprobs: json.choices[0].logprobs.top_logprobs};
    // return { message: this.getNextCompletion(), logProbs: json.choices[0].logprobs};
  }

  getNextCompletion() {
    if (this.completions.length > 0) {
      return this.completions.shift();
    } else {
      return null;
    }
  }

  removeDuplicateCompletions() {
    this.completions = this.completions.filter((item, pos) => {
      return this.completions.indexOf(item) == pos;
    });
  }
}

module.exports = Model;
