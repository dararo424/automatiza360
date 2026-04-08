import { Module } from '@nestjs/common';
import { TallasController } from './tallas.controller';
import { TallasService } from './tallas.service';

@Module({
  controllers: [TallasController],
  providers: [TallasService],
  exports: [TallasService],
})
export class TallasModule {}
