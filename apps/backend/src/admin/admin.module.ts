import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperadminGuard } from './superadmin.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET env var is required and must be at least 32 characters');
        }
        return { secret };
      },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, SuperadminGuard],
})
export class AdminModule {}
