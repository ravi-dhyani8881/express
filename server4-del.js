const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const axios = require('axios');

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
type Query {
  findByQuery(
    query: String
    start: Int
    rows: Int
    filterField: String
    filterQuery: String
    sort: String
    advanceField: String
    advanceQuery: String
    advance: Boolean
  ): ExternalData
}

type ExternalData {
  query: String
  start: String
  row: String
  statusCode: Int
  totalRecords: Int
  records: [Record]
  advanced: [AdvancedField]
}

type Record {
  ID: String
  contentName: String
  contentDesc: String
  contentType: String
  contentSubType: String
  myOwnField_s: String
  _root_: [String]
  logic: [String]
  dynamicFields: [DynamicField]
}

type DynamicField {
  fieldName: String
  values: [String]
}

type AdvancedField {
  fieldName: String
  values: [Value]
}

type Value {
  name: String
  count: Int
}

`);

// Define the root resolver
const root = {
  findByQuery: async ({
    query,
    start,
    rows,
    filterField,
    filterQuery,
    sort,
    advanceField,
    advanceQuery,
    advance,
  }) => {
    const url = `http://localhost:8081/content/findByQuery?query=${query}&start=${start}&rows=${rows}&filterField=${filterField}&filterQuery=${filterQuery}&sort=${sort}&advanceField=${advanceField}&advanceQuery=${advanceQuery}&advance=${advance}`;

    try {
      const response = await axios.get(url);
      const records = response.data.records.map(record => {
        const dynamicFields = Object.keys(record)
        
          .filter(key => key.endsWith('_s')) // assuming dynamic fields end with '_s'
          .map(fieldName => ({
            fieldName,
            values: Array.isArray(record[fieldName]) ? record[fieldName] : [record[fieldName]],
          }));

        return {
          ...record,
          dynamicFields,
        };
      });

      return { ...response.data, records };
    } catch (error) {
      console.error('Error calling external endpoint:', error);
      throw new Error('Failed to fetch data from the external endpoint');
    }
  },
};



// Create an express app
const app = express();

// Setup the GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, // Enable GraphiQL for testing
}));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/graphql`);
});
