import { z } from "zod";

export const createMessageSchema = z
  .object({
    // Ensure we get a valid receiver ID
    receiverId: z
      .string("Receiver ID must be a string")
      .positive("Receiver ID is required"),

    text: z.string("Message text must be a string").optional(),

    // Validates that if an image is sent, it's a valid URL string
    image: z.string().url("Invalid image URL format").optional(),
  })
  // Pro-tip: Ensure the message isn't completely empty!
  // This requires the user to send at least text OR an image.
  .refine((data) => data.text || data.image, {
    message: "A message must contain either text or an image",
    path: ["text"],
  });
