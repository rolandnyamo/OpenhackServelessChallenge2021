const { BlobServiceClient } = require("@azure/storage-blob");

// Load the .env file if it exists
require("dotenv").config();

const STORAGE_CONNECTION_STRING = process.env.svlessbatch_STORAGE || "";
// Note - Account connection string can only be used in node.
const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('orders');

module.exports = async function (context, myBlob) {

    context.log("JavaScript blob trigger function processed blob \n Blob:", context.bindingData.blobTrigger, "\n Blob Size:", myBlob.length, "Bytes");

    let i = 1;
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`Blob ${i++}: ${blob.name}`);
    }

    // for each blob:
    // add table item: partition key: prefix, rowkey: suffix, url: fullBlobUrl
};