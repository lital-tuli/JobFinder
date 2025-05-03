import cors from "cors";

const corsMiddleware = cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  credentials: true
});

export default corsMiddleware;