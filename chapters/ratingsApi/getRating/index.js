module.exports = async function (context, req) {
    context.log('Getting rating.');

    const ratingId = (req.query.ratingId || null);
    const responseMessage = ratingId
        ? "Please provide a ratingId in query parameters."
        : JSON.stringify(await getRating(ratingId));

    context.res = {
        status: 200, /* Defaults to 200 */
        body: responseMessage,
        headers: {
            'Content-Type': 'application/json',
        }
    };
}

async function getRating(id){
    // get dynamoDB rating
    let rating = {
        "id": "79c2779e-dd2e-43e8-803d-ecbebed8972c",
        "userId": "cc20a6fb-a91f-4192-874d-132493685376",
        "productId": "4c25613a-a3c2-4ef3-8e02-9c335eb23204",
        "timestamp": "2018-05-21 21:27:47Z",
        "locationName": "Sample ice cream shop",
        "rating": 5,
        "userNotes": "I love the subtle notes of orange in this ice cream!"
      }

    return rating
}