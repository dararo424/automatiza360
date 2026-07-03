-- Período de facturación del intento de pago (mensual o anual con descuento)
ALTER TABLE "PaymentIntent" ADD COLUMN IF NOT EXISTS "periodo" TEXT NOT NULL DEFAULT 'MENSUAL';
