import * as ACData from "adaptivecards-templating";
import { CardFactory, ConversationReference, TurnContext } from "botbuilder";
import express from "express";
import notificationCard from "./adaptiveCards/notification-default.json";
import { adapter } from "./internal/initialize";
import { ApplicationTurnState } from "./internal/interface";
import conversationReferenceStore from "./store/storage";
import { app } from "./teamsBot";

// Create express application.
const expressApp = express();
expressApp.use(express.json());

const server = expressApp.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${expressApp.name} listening to`, server.address());
});

app.conversationUpdate(
  "membersAdded",
  async (context: TurnContext, state: ApplicationTurnState) => {
    if (!state.conversation.greeted) {
      const reference = TurnContext.getConversationReference(context.activity);
      await conversationReferenceStore.add(getKey(reference), reference, {
        overwrite: true,
      });
      state.conversation.greeted = true;
      await context.sendActivity("Hello and welcome to the team!");
    }
  }
);

// Register an API endpoint with `express`.
//
// This endpoint is provided by your application to listen to events. You can configure
// your IT processes, other applications, background tasks, etc - to POST events to this
// endpoint.
//
// In response to events, this function sends Adaptive Cards to Teams. You can update the logic in this function
// to suit your needs. You can enrich the event with additional data and send an Adaptive Card as required.
//
// You can add authentication / authorization for this API. Refer to
// https://aka.ms/teamsfx-notification for more details.
expressApp.post("/api/notification", async (req, res) => {
  // By default this function will iterate all the installation points and send an Adaptive Card
  // to every installation.
  const pageSize = 100;
  let continuationToken: string | undefined = undefined;
  do {
    if (conversationReferenceStore === undefined || adapter === undefined) {
      throw new Error("NotificationBot has not been initialized.");
    }

    const references = await conversationReferenceStore.list(pageSize, continuationToken);

    const installations = references.data;
    continuationToken = references.continuationToken;

    for (const reference of installations) {
      const cardJson = new ACData.Template(notificationCard).expand({
        $root: {
          title: "New Event Occurred!",
          appName: "Contoso App Notification",
          description: `This is a sample http-triggered notification to ${reference.conversation?.conversationType}`,
          notificationUrl: "https://aka.ms/teamsfx-notification-new",
        },
      });
      await app.sendProactiveActivity(reference, {
        attachments: [CardFactory.adaptiveCard(cardJson)],
      });

      // Note - you can filter the installations if you don't want to send the event to every installation.

      /** For example, if the current target is a "Group" this means that the notification application is
       *  installed in a Group Chat.
      if (reference.conversation?.conversationType === "groupChat") {
        // You can send the Adaptive Card to the Group Chat
        await app.sendProactiveActivity(reference, {
          attachments: [CardFactory.adaptiveCard(cardJson)],
        });
      }
      **/

      /** If the current target is "Channel" this means that the notification application is installed
       *  in a Team.
      if (reference.conversation?.conversationType === "channel") {
        const details = await app.getTeamDetails(reference);
        const teamMembers = await app.getPagedMembers(reference);
        console.log(details, teamMembers.members.length);
      }
      **/

      /** If the current target is "Person" this means that the notification application is installed in a
       *  personal chat.
      if (reference.conversation?.conversationType === "personal") {
        // Directly notify the individual person
        await reference.sendAdaptiveCard(...);
      }
      **/
    }
  } while (continuationToken);

  res.json({});
});

// Register an API endpoint with `express`. Teams sends messages to your application
// through this endpoint.
//
// The Teams Toolkit bot registration configures the bot with `/api/messages` as the
// Bot Framework endpoint. If you customize this route, update the Bot registration
// in `infra/botRegistration/azurebot.bicep`.
expressApp.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, async (context) => {
    await app.run(context);
  });
});

function getKey(reference: Partial<ConversationReference>): string {
  return `_${reference.conversation?.tenantId}_${reference.conversation?.id}`;
}
