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
    cleanTableItems(context.bindings.inputTable)

    context.bindings.outputTable = []
    for await (const blob of containerClient.listBlobsFlat()) {
    //   context.log(`Blob ${i++}: ${blob.name}`);

      let str = blob.name, tag = str.split("-");

      try {
        context.bindings.outputTable.push({
            PartitionKey: tag[0],
            RowKey: tag[1],
            url: "https://svlessbatch.blob.core.windows.net/orders/" + blob.name
        });
      } catch (error) {
          context.log(`error adding ${tag[0]} to the table. probably already exists`)
      }
    }
};

async function cleanTableItems(itemList){

    var obj = {}

    for (let i = 0; i < itemList.length; i++) {
        const PK = itemList[i].PartitionKey;
        const RK = itemList[i].RowKey.replace('.csv', '');
        const url = itemList[i].url;
        
        // obj[PK] && obj[PK][RK] ? null : obj[PK] = { [RK]: RK, url } 
        if (obj[PK]) {
            if(!obj[PK][RK]){
                obj[PK][RK] = { url } 
            }
        } else {
            obj[PK] = { [RK]: { url } } 
        }

        // check if this object is complete
        context.log(obj[PK])
        context.log({
            orderHeaderDetailsCSVUrl: `${obj[PK].OrderHeaderDetails.url}`,
            orderLineItemsCSVUrl: `${obj[PK].OrderLineItems.url}`,
            productInformationCSVUrl: `${obj[PK].ProductInformation.url}`
        })

        if("OrderHeaderDetails" in obj[PK] && "OrderLineItems" in obj[PK] && "ProductInformation" in obj[PK]){
            
            // {
            // "orderHeaderDetailsCSVUrl": "https://soh.blob.core.windows.net/six/XXXXXXXXXXXXXX-OrderHeaderDetails.csv",
            // "orderLineItemsCSVUrl": "https://soh.blob.core.windows.net/six/XXXXXXXXXXXXXX-OrderLineItems.csv",
            // "productInformationCSVUrl": "https://soh.blob.core.windows.net/six/XXXXXXXXXXXXXX-ProductInformation.csv"
            // }
            context.log(obj[PK])
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
        ])
        }

    }
}

async function deleteBlob(list){

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

async function sendForProcessing({items, toDelete, storageDelete}){

    // send to the API endpoint for processing

    axios.post('https://serverlessohmanagementapi.trafficmanager.net/api/order/combineOrderContent', items)
      .then(function (response) {
        context.log(response);

        for (let i = 0; i < toDelete.length; i++) {
            tableClient.deleteEntity(toDelete[i])       
        }

        // delete the blob too:
        deleteBlob(storageDelete)
      })
      .catch(function (error) {
        context.log(error);
      });
    return
}