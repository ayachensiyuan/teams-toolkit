import { TurnState } from "@microsoft/teams-ai";

export interface ConversationState {
  greeted: boolean;
}

export type ApplicationTurnState = TurnState<ConversationState>;

export interface PagedData<T> {
  data: T[];
  continuationToken?: string;
}
