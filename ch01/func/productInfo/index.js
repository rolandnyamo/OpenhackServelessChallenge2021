module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const productId = (req.query.productId || null );
    const responseMessage = productId
        ? `The product name for your product id ${productId} is Starfruit Explosion`
        : "Please add a product ID in query parameters to get information on the product.";

    context.res = {
        status: productId ? 200 : 400, /* Defaults to 200 */
        body: responseMessage
    };
}