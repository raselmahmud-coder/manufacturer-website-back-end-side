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
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `${process.env.URI}`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// db connection
async function run() {
  try {
    await client.connect();
    const toolsCollection = client
      .db("autoparts-assign-12")
      .collection("Tools");
    const usersCollection = client
      .db("autoparts-assign-12")
      .collection("users");
    console.log("database connected");
    // for tools
    app.get("/tools", async (req, res) => {
      const query = {};
      const result = await toolsCollection.find(query).toArray();
      res.send(result);
    });
    // get a specific tool
    app.get("/tool/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      // console.log("got result", result);
      res.send(result);
    });
    // users update in data base using token insert in the front end
    app.put("/users/:email", async (req, res) => {
      const { email } = req.params;
      const { name } = req.body;
      console.log("name", name);
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: { email: email, name: name },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "4d",
        }
      );
      console.log("user", result, token);
      res.send({result, token});
    });
  } catch (err) {
    console.log("error getting", err);
  }
}
run().catch(console.dir);
