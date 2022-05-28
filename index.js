const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

//middle
app.use(cors());
app.use(express.json());

//verify function 

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Invalid authorization' })
    }
    const token = authHeader.split(' ')[1];
    // verify a token symmetric
    jwt.verify(token, process.env.ACCESS_TOKEN_USER, function (err, decoded) {
        if(err){
            return res.status(403).send({ message:'Forbidden access token'})
        }
       req.decoded = decoded;
       next();
    });

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bctj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const toolCollection = client.db('tools-database').collection('tools');
        const orderCollection = client.db('tools-database').collection('orders');
        const userCollection = client.db('tools-database').collection('user');

        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);


        })
        app.get('/tool', async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query).project({ company: 1 });
            const tools = await cursor.toArray();
            res.send(tools);


        })

        //Get all user from the database to show on dashboard

        app.get('/customers',verifyJWT, async (req, res)=>{
            const customers = await userCollection.find().toArray();
            res.send(customers);
        })

        //getting admin for not showing the user the all user option

        app.get('/admin/:email',verifyJWT, async (req, res)=>{
            const email = req.params.email
            const user = await userCollection.findOne({ email: email})
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })

       


        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await toolCollection.findOne(query);
            res.send(order);
        })

        //getting form user 
        app.get('/orders', verifyJWT, async (req, res) => {

            const customer = req.query.customer;
            const decodedEmail = req.decoded.email;

            if(customer===decodedEmail){
                const query = { customer: customer };
                const order = await orderCollection.find(query).toArray();
                 return res.send(order);
            }
            else{
                return res.status(403).send({ message:"Forbidden Request"});
            }
           


        })

        //post -order 

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const query = { name: order.name }
            const exists = await orderCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, order: exists })
            }
            const result = await orderCollection.insertOne(order);
            res.send({ success: true, result });
        })

        app.post('/tools', async (req, res)=>{
            const tool = req.body;
            const result = await toolCollection.insertOne(tool);
            res.send(result);
        })



        //PUT area
         //creating admin Api 
         app.put('/user/admin/:email',verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email:requester})
            if(requesterAccount.role ==='admin'){
                const filter = { email: email };
            
                const updateDocument = {
                    $set:{role:'admin'},
                };
                const result = await userCollection.updateOne(filter, updateDocument);
                
                res.send(result);
            }
            else{
                res.status(403).send({ message: 'Access Denied' });
            }


           

        })


        //put for the user 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDocument = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDocument, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_USER);
            res.send({ result, token });

        })



    }
    finally {

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