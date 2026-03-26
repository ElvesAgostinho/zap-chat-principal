-- Add columns to store the WhatsApp instance profile picture and phone number
ALTER TABLE "public"."lojas"
ADD COLUMN IF NOT EXISTS "instance_profile_pic" TEXT,
ADD COLUMN IF NOT EXISTS "instance_number" TEXT;
