import express from 'express';
import { createClient } from 'redis';
import axios from 'axios';

const app = express();
app.use(express.urlencoded({extended: true}))

const client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

const { data } = await axios.get("https://jsonplaceholder.typicode.com/photos")
await client.setEx('photos', 3600, JSON.stringify(data));

//await client.set('key', 'value');
const value = await client.get('photos');
console.log("Value::", value)
await client.disconnect();