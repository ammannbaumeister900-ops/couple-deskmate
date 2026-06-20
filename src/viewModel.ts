import { otherUser, UserId } from "./demoState";

export function desktopUserOrder(viewerId: UserId): [UserId, UserId] {
  return [viewerId, otherUser(viewerId)];
}
