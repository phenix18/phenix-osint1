import type { Message } from "@prisma/client"
import NodeCache from "node-cache"
import Database from "../../../libs/database"
//import config from "../../../utils/config"

const message = new NodeCache({
  stdTTL: 60 * 10, // 10 mins
  useClones: false
})

export const getMessage = async (messageId: string) => {
  try {
    if (message.has(messageId)) return message.get(messageId) as Message

    const messageData = await Database.message.findUnique({
      where: { messageId }
    })

    if (messageData) message.set(messageId, messageData)

    return messageData
  } catch {
    return null
  }
}

export const createMessage = async (messageId: string, metadata: Partial<Omit<Message, "id" | "messageId">>) => {
  try {
    if (message.has(messageId)) return message.get(messageId) as Message

    const messageData = await Database.message.create({
      data: {
        messageId,
        ...metadata
      }
    })

    if (messageData) message.set(messageId, messageData)

    return messageData
  } catch {
    return null
  }
}

export const updateMessage = async (messageId: string, messageInput: Partial<Omit<Message, "id" | "messageId">>) => {
  try {
    const messageData = await Database.message.update({
      where: { messageId },
      data: { ...messageInput }
    })

    if (messageData) message.set(messageId, messageData)

    return messageData
  } catch {
    return null
  }
}

export const deleteMessage = async (messageId: string) => {
  try {
    if (message.has(messageId)) message.del(messageId)

    return await Database.message.delete({ where: { messageId } })
  } catch {
    return null
  }
}
