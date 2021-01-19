module.exports = async function (context, req) {
    context.log('Getting all ratings from the database.');

    const responseMessage = JSON.stringify(await getRatings());

    context.res = {
        status: 200, /* Defaults to 200 */
        body: responseMessage,
        headers: {
            'Content-Type': 'application/json',
        }
    };
}

async function getRatings(id) {
    // get dynamoDB rating
    let ratings = [
        {
            "id": "79c2779e-dd2e-43e8-803d-ecbebed8972c",
            "userId": "cc20a6fb-a91f-4192-874d-132493685376",
            "productId": "4c25613a-a3c2-4ef3-8e02-9c335eb23204",
            "timestamp": "2018-05-21 21:27:47Z",
            "locationName": "Sample ice cream shop",
            "rating": 5,
            "userNotes": "I love the subtle notes of orange in this ice cream!"
        },
        {
            "id": "8947f7cc-6f4c-49ed-a7aa-62892eac8f31",
            "userId": "cc20a6fb-a91f-4192-874d-132493685376",
            "productId": "e4e7068e-500e-4a00-8be4-630d4594735b",
            "timestamp": "2018-05-20 09:02:30Z",
            "locationName": "Another Sample Shop",
            "rating": 4,
            "userNotes": "I really enjoy this grape ice cream!"
        }
    ]

    return ratings
}