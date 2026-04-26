import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { EquipoController } from './equipo.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { TwilioModule } from '../twilio/twilio.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET env var is required and must be at least 32 characters');
        }
        return { secret, signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any } };
      },
    }),
    TwilioModule,
  ],
  controllers: [AuthController, EquipoController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
