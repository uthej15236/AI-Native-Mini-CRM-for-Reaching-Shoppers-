import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Xeno channel simulator running on port ${env.port}`);
});

