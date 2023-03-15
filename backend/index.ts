import express from "express";
import helmet from "helmet";
import cors from "cors";
import router from "./src/router";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use("/", router);
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
