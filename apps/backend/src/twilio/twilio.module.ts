import { Module } from '@nestjs/common';
import { TwilioProvisioningService } from './twilio-provisioning.service';

@Module({
  providers: [TwilioProvisioningService],
  exports: [TwilioProvisioningService],
})
export class TwilioModule {}
