const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    context.log('Creating a rating.');

    // Validating the payload

    let payload = req.body, payloadValid = false;

    if(!(payload.userId && payload.productId && payload.locationName && payload.rating && payload.userNotes)){
        payloadValid = false;
    }

    // generate uuid
    payload = { ...payload, id: `${uuidv4()}`}
    
    context.log(payload)

    const responseMessage = !payloadValid
        ? "Invalid request body. Please review documentation."
        : JSON.stringify(await createDBRecord(payload));

    context.res = {
        status: payloadValid ? 200 : 400, /* Defaults to 200 */
        body: payloadValid ? JSON.stringify(responseMessage) : responseMessage,
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

async function createDBRecord({id, userId, productId, locationName, userNotes, rating}){
    let userValid = await getUser(userId), productValid = await getProduct(productId), res;

    if(!(userValid && productValid)){ //user and/or productId is invalid
        return {
            message: 'Invalid userId or productId'
        }
    }

    return {id, userId, productId, locationName, userNotes, rating}
}