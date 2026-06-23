import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobPost } from './jobs/entities/job-post.entity';
import { Proposal } from './jobs/entities/proposal.entity';
import { ProposalModule } from './proposal/proposal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [JobPost, Proposal],
        // MVP: auto-sync schema. Switch to migrations before any real deploy.
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    ProposalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
