-- Marca de datos de ejemplo sembrados al registrarse (borrables por el usuario)
ALTER TABLE "Order"        ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ticket"       ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment"  ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contact"      ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
