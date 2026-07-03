-- CreateIndex
CREATE INDEX "Tenant_active_ownerPhone_idx" ON "Tenant"("active", "ownerPhone");

-- CreateIndex
CREATE INDEX "Tenant_subscriptionStatus_idx" ON "Tenant"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "User_tenantId_role_active_idx" ON "User"("tenantId", "role", "active");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");
