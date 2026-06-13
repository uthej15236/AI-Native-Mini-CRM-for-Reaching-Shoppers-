import app from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { ensureDemoData } from "./services/demoData.service";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await ensureDemoData();
    app.listen(env.port, () => {
      console.log(`Xeno Copilot API running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start Xeno Copilot API", error);
    process.exit(1);
  }
};

void startServer();

