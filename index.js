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
    const ordersCollection = client
      .db("autoparts-assign-12")
      .collection("orders");
    const reviewsCollection = client
      .db("autoparts-assign-12")
      .collection("reviews");
    console.log("database connected");
    // for home page tools getting
    app.get("/tools", async (req, res) => {
      const query = {};
      const result = await toolsCollection.find(query).toArray();
      res.send(result);
    });
    // update a tool when user confirm a order
    app.put("/tool/:id", async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;
      // console.log(quantity, "put tool....", id);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: { quantity: quantity },
      };
      const result = await toolsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      // console.log("got result", result);
      res.send(result);
    });
    // Add a tool when admin request to insert from add a product page
    app.post("/tool/:email", async (req, res) => {
      const email = req.params; //email for security verify
      const tool = req.body;
      const query = {
        name: tool.name,
        price: tool.price,
        quantity: tool.quantity,
        image: tool.image,
        description: tool.description,
      };

      const result = await toolsCollection.insertOne(query);
      console.log("got result", result);
      res.send(result);
    });
    // get a specific tool for details info show in the purchase page
    app.get("/tool/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      // console.log("got result", result);
      res.send(result);
    });
    // delete a specific tool if admin request
    app.delete("/tool/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      console.log("got result for delete", result);
      res.send(result);
    });
    // users update in data base using token insert in the front end when registration
    app.put("/users/:email", async (req, res) => {
      const { email } = req.params;
      const { name } = req.body;
      console.log("name", name);
      console.log("email", email);
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
      res.send({ result, token });
      // console.log("user", result, token);
    });
    // insert a order in the database
    app.post("/order", async (req, res) => {
      const order = req.body;
      // console.log("order", order);
      const result = await ordersCollection.insertOne(order);
      // sendAppointmentEmail(order);
      res.send(result);
    });
    // update the order after payment
    app.put("/order/:id", async (req, res) => {
      const { id } = req.params;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      console.log("payment info", payment, filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          paymentStatus: payment.paymentStatus,
          transactionId: payment.transactionId,
        },
      };
      const result = await ordersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      // sendAppointmentEmail(order);
      res.send(result);
    });
    //each user get all orders
    app.get("/orders/:email", async (req, res) => {
      const { email } = req.params;

      const query = { userEmail: email };
      const result = await ordersCollection.find(query).toArray();
      // console.log("getting result", result);
      res.send(result);
    });
    //Admin get all orders
    app.get("/admin-orders/:email", async (req, res) => {
      const { email } = req.params;
      const query = {};
      const result = await ordersCollection.find(query).toArray();
      // console.log("getting result", result);
      res.send(result);
    });
    // get a order for payment
    app.get("/order/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.findOne(query);
      // console.log("getting result", result);
      res.send(result);
    });
    // delete a order
    app.delete("/order/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      console.log("delete id",id, result);
      res.send(result);
    });
    // make a payment intent post api
    app.post("/create-payment-intent", async (req, res) => {
      const { productPrice } = req.body;
      // console.log("Price", productPrice, "body", req.body);
      if (productPrice) {
        const amount = productPrice * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        // console.log("secret", paymentIntent.client_secret);
        res.send({ clientSecret: paymentIntent.client_secret });
      }
    });
    // add a review
    app.post("/add-review", async (req, res) => {
      const { review } = req.body;
      console.log("get review", review);
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    // get all reviews
    app.get("/reviews", async (req, res) => {
      const query = {};
      const result = await reviewsCollection.find(query).toArray();
      // console.log("review",result);
      res.send(result);
    });
    // my profile data insert
    app.patch("/update-profile/:email", async (req, res) => {
      const { email } = req.params;
      const { data } = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          higherDegree: data.degree,
          location: data.location,
          linkedinLink: data.linkedinLink,
          phone: data.phone,
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      // console.log(email, "data...", data);
      res.send(result);
    });
    // show user info in the view profile page
    app.get("/user/:email", async (req, res) => {
      const { email } = req.params;
      if (email) {
        const query = { email: email };
        const result = await usersCollection.findOne(query);
        console.log("user request", email, result);
        res.send([result]);
      }
      // console.log("email", result);
    });
    // get all user only can browse admin
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    // update the role when admin request
    app.patch("/user/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email: email };
      const option = { upsert: true };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(query, updateDoc, option);
      res.send(result);
    });
    // delete a user when admin request
    app.delete("/user/:email", async (req, res) => {
      const { email } = req.params;
      console.log("expected", email);
      const query = { email: email };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // end of try block
  } catch (err) {
    console.log("error getting", err);
  }
}
run().catch(console.dir);
