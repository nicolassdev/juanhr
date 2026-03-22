import { Module } from '@nestjs/common';
import { DtrController } from './dtr.controller';
import { DtrService } from './dtr.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MulterModule.register({ dest: './uploads/selfies' })],
  controllers: [DtrController],
  providers: [DtrService],
  exports: [DtrService],
})
export class DtrModule {}
