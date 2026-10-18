import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Travel Social API is running!");
});

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from the Travel Social backend!",
    status: "success"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
