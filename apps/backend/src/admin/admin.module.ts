import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperadminGuard } from './superadmin.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'secret',
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, SuperadminGuard],
})
export class AdminModule {}
