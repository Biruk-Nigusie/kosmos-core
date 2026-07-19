import { CollaborationService } from "../services/collaboration.service";
import { inviteUserType, acceptInvitationType } from "../types";

export const CollaborationController = {
  // Pass the whole data object
  async invite(data: inviteUserType, senderId: string) {
    return await CollaborationService.inviteUser(data, senderId);
  },

  // Pass the whole data object
  async accept(data: acceptInvitationType, userId: string) {
    return await CollaborationService.acceptInvitation(data, userId);
  },
};
