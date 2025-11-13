import { NotificationType } from "@prisma/client";
import z from "zod";

export const NotificationTypeEnum = z.enum(NotificationType)
