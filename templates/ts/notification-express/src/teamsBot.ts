import { Application } from "@microsoft/teams-ai";
import { MemoryStorage } from "botbuilder";
import config from "./internal/config";
import { adapter } from "./internal/initialize";
import { ApplicationTurnState } from "./internal/interface";

// Define storage and application
const storage = new MemoryStorage();
export const app = new Application<ApplicationTurnState>({
  // Adapter and botAppId are required for the Application to send proactive messages.
  adapter: adapter,
  botAppId: config.MicrosoftAppId,
  storage: storage,
});
