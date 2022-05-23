require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("assignment 12 running the server");
});
app.listen(port, () => {
  console.log(`assignment 12 app listening on port ${port}`);
});
// db uri
// import { MongoClient } from "mongodb";
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `${process.env.URI}`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// db connection
async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("autoparts-assign-12").collection("Tools");
    console.log("toolsCollection is ready");
    // for tools 
    app.get('/tools', async (req, res) => {
      const query = {};
      const result = await toolsCollection.find(query).toArray();
      // console.log("tools",result);
      res.send(result)
      
    })

  } catch (err) {
    console.log("error getting",err);
  }
}
run().catch(console.dir);

