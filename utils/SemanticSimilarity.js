module.exports =  async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	// return result;
	
	return { input_token: data.inputs.sourse_sentence, token: data.inputs.sentences[result.indexOf(Math.max(...result))], semantic_similarity_score: Math.max(...result)};

}

