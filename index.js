const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
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

        app.get('/tools',async(req,res) =>{
            const query ={};
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);


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