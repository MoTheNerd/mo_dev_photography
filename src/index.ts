require('dotenv').config();
import { Db, MongoError, MongoClient } from "mongodb";
import express from 'express'
import moment from 'moment'
import bodyParser from 'body-parser'
import axios from 'axios'

const mongocs = process.env.MONGO_CONNECTION_STRING;
let db: Db;
const port = process.env.PORT ? process.env.PORT : 6003;
const app = express();

app.use(bodyParser.json());

require('mongodb').connect(mongocs, { useNewUrlParser: true, useUnifiedTopology: true }, (err: MongoError, result: MongoClient) => {
    if (err) {
        console.log(err)
        process.exit(1);
    } else {
        db = result.db('default')
    }
})

const checkTokenAuthenticatedWithAuthServer = async (token: String) => {
    let status = (await axios.post(`/api/auth/authenticateUsingToken`, { token })).data.code
    return status === 200 ? true : false
}

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Photography MicroService API is running")
})

app.listen(port, () => console.log(`Photography microservice listening on port: ${port}!`))