module.exports = async function (context, eventHubMessages) {
    context.log(`Eventhub trigger function called.}`);
    context.bindings.outputSbMsg = []
    for (let i = 0; i < eventHubMessages.length; i++) {
        const msg = cleanRecord(eventHubMessages[i], context);
        msg !== null ? context.bindings.outputSbMsg.push(msg) : context.log("An error occured.")
    }
};

function cleanRecord(payload, context){

    if(!(payload.header && payload.details)){
        context.log("Invalid payload")

        try {
            context.log(JSON.stringify(payload))
        } catch (error) {
            context.log(payload)
        }

        return null
    }

    let obj = {}

    context.log(`cleaning msg with sales number ${payload.header.salesNumber}`)

    obj.totalItems = payload.details.length;
    obj.salesNumber = payload.header.salesNumber;
    obj.salesDate = payload.header.dateTime;
    obj.storeLocation = payload.header.locationId;
    obj.receiptUrl = payload.header.receiptUrl;
    obj.totalCost = 0;

    for (let i = 0; i < payload.details.length; i++) {
        const price = payload.details[i].totalCost;

        obj.totalCost += price;        
    }

    context.log(obj)

    return obj
}