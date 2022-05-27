const express = require('express');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const cors = require('cors');

const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

//middle
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bctj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();

        const toolCollection = client.db('tools-database').collection('tools');
        const orderCollection = client.db('tools-database').collection('orders');
        const userCollection = client.db('tools-database').collection('user');

        app.get('/tools',async(req,res) =>{
            const query ={};
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);


        })

        //put for the user 
        app.put('/user/:email', async(req, res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter ={email: email};
            const options = {upsert: true};
            const updateDocument ={
                $set:user,
            };
            const result = await userCollection.updateOne(filter,updateDocument, options);
            const token = jwt.sign({email:email }, process.env.ACCESS_TOKEN_USER);
            res.send({result,token});

        })


        app.get('/order/:id',async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const order = await toolCollection.findOne(query);
            res.send(order);
        })

        //getting form user 
        app.get('/orders',async(req, res)=>{

            const customer = req.query.customer;
            const query = {customer: customer};
            const order = await orderCollection.find(query).toArray();
            res.send(order);


        })

        //post -order 

        app.post('/orders',async(req, res)=>{
            const order = req.body;
            const query ={name: order.name}
            const exists = await orderCollection.findOne(query);
            if(exists){
                return res.send({success: false,order:exists})
            }
            const result = await orderCollection.insertOne(order);
            res.send({success: true,result});
        })

       

    }
    finally{

    }
}
run().catch(console.dir);

//get

app.get('/', (req, res) => {
    res.send('running');
})

app.listen(port, () => {
    console.log('listening', port);
})