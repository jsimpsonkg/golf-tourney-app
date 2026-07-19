import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import apiRouter from './routes/index';

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (request, response) => {
  response.status(200).send("Golf Tournaments");
});

app.use('/api', apiRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));