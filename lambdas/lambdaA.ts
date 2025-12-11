/* eslint-disable import/extensions, import/no-absolute-path */
import { SQSHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DBAuctionItem , AuctionItem, AuctionType } from "../shared/types";

const ddbDocClient = createDDbDocClient();

export const handler: SQSHandler = async (event) => {
  console.log("Event ", JSON.stringify(event));

  for (const record of event.Records) {
    const auctionItem = JSON.parse(record.body) as AuctionItem;
    const attributes = record.messageAttributes.auction_type.stringValue as AuctionType;

    const marketValue = auctionItem.marketValue;
    const minimumPrice = auctionItem.minimumPrice;

    if (marketValue < minimumPrice) {
      throw new Error("Item can't be written to DB, market Value less than minimum Price");
    }
    else {
    const dbItem: DBAuctionItem = {
      ...auctionItem,
      auctionType: attributes,
    }
    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ...dbItem,
        },
      })
    );
    }


  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
