import express from 'express';
import { createClient } from 'redis';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.urlencoded({extended: true}))
app.use(cors());

const redisClient = await createClient()
                    .on('error', (err) => console.log("Redis Connection Issue", err))
                    .connect();

const DEFAULT_EXPIRATION = 3600;
await redisClient.flushAll() // Remove all keys when server starts

app.get('/photos', async(req, res) => {
    const albumId = req.query.albumId;
    const photos = await getOrSetCache(`photos?albumId=${albumId}`, async() => {
        const { data } = await axios.get('https://jsonplaceholder.typicode.com/photos', {
            params: { albumId }
        });
        return data;
    })
    res.json(photos);
})

app.get('/photos/:id', async(req, res) => {
    const photo = await getOrSetCache(`photos-${req.params.id}`, async() => {
        const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`);
        return data;
    })
    res.json(photo);
})

async function getOrSetCache(key, cb) {
    try {
        const data = await redisClient.get(key);
        if(data) {
            console.log("Cache Hit");
            return JSON.parse(data);
        } else {
            const newData = await cb();
            await redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(newData));
            console.log("Cache Miss");
            return newData;
        }
    } catch(e) {
        console.log("Redis error:", e)
    }
}

app.listen(3000, () => console.log("Server listening on 3000..."))
                