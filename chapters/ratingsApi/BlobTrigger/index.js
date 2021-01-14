const { BlobServiceClient, BlobBatchClient } = require("@azure/storage-blob");
const axios = require('axios');

// Load the .env file if it exists
require("dotenv").config();

const STORAGE_CONNECTION_STRING = process.env.svlessbatch_STORAGE || "";
// Note - Account connection string can only be used in node.
const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
const blobBatchClient = BlobBatchClient.fromConnectionString(STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('orders');

module.exports = async function (context, myBlob) {

    context.log("JavaScript blob trigger function processed blob \n Blob:", context.bindingData.blobTrigger, "\n Blob Size:", myBlob.length, "Bytes");

    context.log('input table:')
    context.log(context.bindings.inputTable)

    let i = 1;
    for await (const blob of containerClient.listBlobsFlat()) {
      context.log(`Blob ${i++}: ${blob.name}`);

      let str = blob.name, tag = str.match(/(.+)-(.+)/);

      try {
        context.bindings.outputTable.push({
            PartitionKey: tag[0],
            RowKey: tag[1],
            url: "https://svlessbatch.blob.core.windows.net/orders/" + blob.name
        });
      } catch (error) {
          context.log(error)
      }
    }

    // for each blob:
    // add table item: partition key: prefix, rowkey: suffix, url: fullBlobUrl
};

async function deleteBlob(prefix){

    return
}

async function sendForProcessing(items){

    // send to the API endpoint for processing

    axios.post('https://serverlessohmanagementapi.trafficmanager.net/api/order/combineOrderContent', items)
      .then(function (response) {
        context.log(response);
      })
      .catch(function (error) {
        context.log(error);
      });
    return
}

async function deleteTableEntry(entry){

    // delete a certain partition key

    return
}