require('dotenv').config();
import { Db, MongoError, MongoClient } from "mongodb";
import express from 'express'
import moment from 'moment'
import bodyParser from 'body-parser'
import axios from 'axios'
import aws from 'aws-sdk'
import crypto from 'crypto';
import { PutObjectRequest } from "aws-sdk/clients/s3";
import { Buffer } from "buffer";


const s3 = new aws.S3({
    endpoint: 'sfo2.digitaloceanspaces.com',
    accessKeyId: process.env.MO_DEV_SPACE_KEY,
    secretAccessKey: process.env.MO_DEV_SPACE_SECRET,
});
const mongocs = process.env.MONGO_CONNECTION_STRING;
const port = process.env.PORT ? process.env.PORT : 6003;

let db: Db;
const app = express();

app.use(bodyParser.json({ limit: '50mb' }));

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

app.post("/upload", async (req: express.Request, res: express.Response) => {
    let putObjReq: PutObjectRequest
    var base64Data = req.body.data.replace(/^data:image\/png;base64,/, "").replace(/^data:image\/jpeg;base64,/, "");
    let filename = `photography/${crypto.randomBytes(2).toString('hex')}_${moment.utc().toISOString()}_${req.body.filename}`
    putObjReq = {
        Bucket: 'modev',
        Key: `${filename}`,
        Body: Buffer.from(base64Data, "base64"),
        ACL: 'public-read',
        ContentType: `image/${req.body.filename.split('.')[req.body.filename.split('.').length - 1].toLowerCase() === 'png' ? 'png' : 'jpeg'}`
    }

    if (checkTokenAuthenticatedWithAuthServer(req.body.token)) {
        await s3.upload(putObjReq, async (err, file) => {
            if (err) {
                res.send({
                    code: 500,
                    message: "An internal server error occurred"
                })
            } else {
                res.send({
                    code: 200,
                    message: "File uploaded successfully!",
                    file
                })
                await db.collection('photos').insertOne({ filename, url: `https://modev.sfo2.digitaloceanspaces.com/${filename}` })
            }
        })
    } else {
        res.send({
            code: 301,
            message: "You are not authorized to upload images."
        })
    }
})

app.get('/photos',async (req: express.Request, res: express.Response) => {
    res.send(await db.collection('photos').find({}).toArray())
})

app.listen(port, () => console.log(`Photography microservice listening on port: ${port}!`))