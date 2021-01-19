const { v4: uuidv4 } = require('uuid');

/**
 * Sentiment Analysis setup
 */
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const key = process.env.Sentiment_Key;
const endpoint = process.env.Sentiment_Endpoint;

module.exports = async function (context, req) {
    context.log('Creating a rating.');

    // Validating the payload

    let payload = req.body, payloadValid = false;

    if(payload.userId && payload.productId && payload.locationName && payload.rating && payload.userNotes){
        payloadValid = true;
    }

    // generate uuid
    payload = { ...payload, id: `${uuidv4()}`}
    
    // context.log(payload)

    context.bindings.outputDocument = JSON.stringify(payload)

    const responseMessage = !payloadValid
        ? "Invalid request body. Please review documentation."
        : JSON.stringify(await createDBRecord(payload, context));

    context.res = {
        status: payloadValid ? 200 : 400, /* Defaults to 200 */
        body: responseMessage,
        headers: {
            'Content-Type': 'application/json',
        }
    };
}

async function getUser(userId){
    // check the api to see if the user exists

    return true
}

async function getProduct(productId){
    // check the api to see if the prodct exists

    return true
}

async function createDBRecord({id, userId, productId, locationName, userNotes, rating}, context){
    let userValid = await getUser(userId), productValid = await getProduct(productId), res;

    if(!(userValid && productValid)){ //user and/or productId is invalid
        return {
            message: 'Invalid userId or productId'
        }
    }
    let payload = {id, userId, productId, locationName, userNotes, rating}

    await sentimentAnalysis({sentimentInput:[userNotes], payload}, context)

    return payload
}

// [
//     {
//         "id": "0",
//         "warnings": [],
//         "sentiment": "negative",
//         "confidenceScores": {
//             "positive": 0,
//             "neutral": 0,
//             "negative": 1
//         },
//         "sentences": [
//             {
//                 "text": "I hated everything about orange in this ice cream!",
//                 "sentiment": "negative",
//                 "confidenceScores": {
//                     "positive": 0,
//                     "neutral": 0,
//                     "negative": 1
//                 },
//                 "offset": 0,
//                 "length": 50
//             }
//         ]
//     }
// ]

async function sentimentAnalysis({sentimentInput, payload}, context){

    const textAnalyticsClient = new TextAnalyticsClient(endpoint,  new AzureKeyCredential(key));

    const sentimentResult = await textAnalyticsClient.analyzeSentiment(sentimentInput);

    if (sentimentResult && sentimentResult[0].confidenceScores.negative > 0.7) {
        context.log.warn(`Negative sentiment detected for rating ` + payload.id )
    } else context.log(`Positive sentiment detected for rating ` + payload.id )

    context.log(JSON.stringify(sentimentResult))
}