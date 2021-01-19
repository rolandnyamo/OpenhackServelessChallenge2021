const { BlobServiceClient, BlobBatchClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const axios = require('axios');
const { TableClient, TablesSharedKeyCredential } = require("@azure/data-tables");

// Load the .env file if it exists
require("dotenv").config();

/**
 * Table settings
 */
const tableAccount = "svlessbatch";
const accountKey = process.env.Storage_Account_Key;
const tableName = "orders"

const credential = new TablesSharedKeyCredential(tableAccount, accountKey);
const tableClient = new TableClient(
  `https://${tableAccount}.table.core.windows.net`,
  tableName,
  credential
);

const storageCreds = new StorageSharedKeyCredential('svlessbatch', accountKey)
const STORAGE_CONNECTION_STRING = process.env.svlessbatch_STORAGE || "";
// Note - Account connection string can only be used in node.
const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
// const blobBatchClient = BlobBatchClient.fromConnectionString(STORAGE_CONNECTION_STRING); //<-- error, this isn't a function
const containerClient = blobServiceClient.getContainerClient('orders');

module.exports = async function (context, myBlob) {

    // context.log("JavaScript blob trigger function processed blob \n Blob:", context.bindingData.blobTrigger, "\n Blob Size:", myBlob.length, "Bytes");

    // context.log('input table:')
    await cleanTableItems(context.bindings.inputTable, context)

    context.bindings.outputTable = []
    for await (const blob of containerClient.listBlobsFlat()) {
      context.log(`Blob ${i++}: ${blob.name}`);

      let str = blob.name, tag = str.split("-");

      try {
        context.bindings.outputTable.push({
            PartitionKey: tag[0],
            RowKey: tag[1],
            url: "https://svlessbatch.blob.core.windows.net/orders/" + blob.name
        });
      } catch (error) {
          context.log(`error adding https://svlessbatch.blob.core.windows.net/orders/${blob.name} to the table. probably already exists`)
          context.log(error)
      }
    }
};

async function cleanTableItems(itemList, context){

    var obj = {}

    context.log(`cleaning table items ${JSON.stringify(itemList)}`)

    for (let i = 0; i < itemList.length; i++) {
        const PK = itemList[i].PartitionKey;
        const RK = itemList[i].RowKey.replace('.csv', '');
        const url = itemList[i].url;
        
        if (obj[PK]) {
            if(!obj[PK][RK]){
                context.log('found first item')
                obj[PK][RK] = { url } 
            }
        } else {
            obj[PK] = { [RK]: { url } } 
        }

        for (let j = 0; j < itemList.length; j++) {
            const PK2 = itemList[j].PartitionKey;
            const RK2 = itemList[j].RowKey.replace('.csv', '');
            const url2 = itemList[j].url;

            if(PK2 === PK){                
                if(!obj[PK][RK2]){
                    context.log('found second item')
                    obj[PK][RK2] = { url: url2 } 
                }
            }

            for (let k = 0; k < itemList.length; k++) {
                const PK3 = itemList[k].PartitionKey;
                const RK3 = itemList[k].RowKey.replace('.csv', '');
                const url3 = itemList[k].url;
    
                if(PK3 === PK){                    
                    if(!obj[PK][RK3]){
                        context.log('found third item')
                        obj[PK][RK3] = { url: url3 } 
                    }
                }
                
            }            
        }

        if("OrderHeaderDetails" in obj[PK] && "OrderLineItems" in obj[PK] && "ProductInformation" in obj[PK]){

            // check if this object is complete
            context.log("found all 3 matches")
            context.log(obj)
            
            context.log({
                orderHeaderDetailsCSVUrl: `${obj[PK].OrderHeaderDetails.url}`,
                orderLineItemsCSVUrl: `${obj[PK].OrderLineItems.url}`,
                productInformationCSVUrl: `${obj[PK].ProductInformation.url}`
            })
            await sendForProcessing({
                orderHeaderDetailsCSVUrl: `${obj[PK].OrderHeaderDetails.url}`,
                orderLineItemsCSVUrl: `${obj[PK].OrderLineItems.url}`,
                productInformationCSVUrl: `${obj[PK].ProductInformation.url}`
            }, [
                {PartitionKey: PK, RowKey: "OrderHeaderDetails.csv"},
                {PartitionKey: PK, RowKey: "OrderLineItems.csv"},
                {PartitionKey: PK, RowKey: "ProductInformation.csv"}
            ],
            [
                obj[PK].OrderHeaderDetails.url,
                obj[PK].OrderLineItems.url,
                obj[PK].ProductInformation.url
            ], context)
        }

    }
}

async function deleteBlob(list, context){

    context.log('deleting')
    context.log(list)

    const batchclient = new BlobBatchClient('https://svlessbatch.blob.core.windows.net/orders/', storageCreds)

    try {
        batchclient.deleteBlobs(list, storageCreds)
    } catch (error) {
        context.log(error)
    }
    return
}

async function sendForProcessing(items, toDelete, storageDelete, context){

    // send to the API endpoint for processing
    context.log("sending for processing")

    axios.post('https://serverlessohmanagementapi.trafficmanager.net/api/order/combineOrderContent', items)
      .then(function (response) {
        context.log(response);

        for (let i = 0; i < toDelete.length; i++) {
            tableClient.deleteEntity(toDelete[i])
            context.log(`deleted ${toDelete[i]} from storage table`)       
        }

        // delete the blob too:
        deleteBlob(storageDelete, context)
      })
      .catch(function (error) {
        context.log(error);
      });
    return
}