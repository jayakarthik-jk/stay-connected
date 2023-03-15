import { Conversation, PrismaClient, User } from "@prisma/client";

let prisma = new PrismaClient();

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

async function getUser(email: string) {
  // Get user from database
  const user = await getPrismaClient().user.findUnique({
    where: {
      email,
    },
  });
  return user;
}

async function createUser(email: string) {
  // Create user in database
  const user = await getPrismaClient().user.create({
    data: {
      email,
    },
  });
  return user;
}

async function sendFriendRequest(userId: string, friendId: string) {
  return await getPrismaClient().$transaction(async (prisma) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) return new Error("User not found");

    const friend = await prisma.user.findUnique({
      where: {
        id: friendId,
      },
    });
    if (!friend) return new Error("Friend not found");

    const request = await prisma.request.create({
      data: {
        senderId: user.id,
        receiverId: friend.id,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        outgoingRequests: {
          connect: {
            id: request.id,
          },
        },
      },
    });
    await prisma.user.update({
      where: {
        id: friendId,
      },
      data: {
        incomingRequests: {
          connect: {
            id: request.id,
          },
        },
      },
    });
    return request;
  });
}

async function acceptFriendRequest(user: User, friend: User) {
  return await getPrismaClient().$transaction(async (prisma) => {
    const requests = await prisma.request.findMany({
      where: {
        senderId: friend.id,
        receiverId: user.id,
      },
    });
    const request = requests[0];
    if (!request) return new Error("Request not found");

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        friends: {
          push: friend.id,
        },
      },
    });
    await prisma.user.update({
      where: {
        id: friend.id,
      },
      data: {
        friends: {
          push: user.id,
        },
      },
    });
    await prisma.request.update({
      where: {
        id: request.id,
      },
      data: {
        status: "accepted",
      },
    });
    return updatedUser;
  });
}

async function rejectFriendRequest(user: User, friend: User) {
  return await getPrismaClient().$transaction(async (prisma) => {
    const requests = await prisma.request.findMany({
      where: {
        senderId: friend.id,
        receiverId: user.id,
      },
    });
    const request = requests[0];
    if (!request) return new Error("Request not found");

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        incomingRequests: {
          disconnect: {
            id: request.id,
          },
        },
      },
    });

    await prisma.request.update({
      where: {
        id: request.id,
      },
      data: {
        status: "rejected",
      },
    });
    return updatedUser;
  });
}

async function sendMessage(sender: User, receipient: User, text: string) {
  if (!sender.friends.includes(receipient.id)) {
    return new Error("You are not friends with this user");
  }

  const conversationId =
    sender.id > receipient.id
      ? `${sender.id}-${receipient.id}`
      : `${receipient.id}-${sender.id}`;
  let conversation = await getPrismaClient().conversation.findUnique({
    where: {
      conversationId,
    },
    include: {
      messages: true,
    },
  });
  if (!conversation) {
    conversation = await getPrismaClient().conversation.create({
      data: {
        conversationId,
        messages: {
          create: {
            senderId: sender.id,
            receiverId: receipient.id,
            content: text,
          },
        },
      },
      include: {
        messages: true,
      },
    });
  } else {
    conversation = await getPrismaClient().conversation.update({
      where: {
        conversationId,
      },
      data: {
        messages: {
          create: {
            senderId: sender.id,
            receiverId: receipient.id,
            content: text,
          },
        },
      },
      include: {
        messages: true,
      },
    });
  }
  return conversation;
}

async function updateMessageStatus(sender: User, receipient: User) {
  const conversationId =
    sender.id > receipient.id
      ? `${sender.id}-${receipient.id}`
      : `${receipient.id}-${sender.id}`;
  const conversation = await getPrismaClient().conversation.findUnique({
    where: {
      conversationId,
    },
    include: {
      messages: true,
    },
  });
  if (!conversation) return new Error("Conversation not found");

  const messages = conversation.messages.filter(
    (message) => message.senderId === receipient.id
  );
  if (!messages || messages.length < 0) return new Error("No messages found");

  const updatedMessages = await getPrismaClient().message.updateMany({
    where: {
      id: {
        in: messages.map((message) => message.id),
      },
    },
    data: {
      status: "read",
    },
  });
  return updatedMessages;
}

export default {
  getUser,
  createUser,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  sendMessage,
  updateMessageStatus,
};
