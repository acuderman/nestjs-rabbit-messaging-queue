import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqExchangeUtil } from './rmq-exchange.util';
import { RmqService } from './rmq.service';
import { RabbitMQInitConfig, RabbitMQModuleConfig } from './rmq.interfaces';

@Module({})
export class RmqModule {
  static register(options: RabbitMQModuleConfig): DynamicModule {
    const rmqConfigFactory = (...args): RabbitMQInitConfig => {
      const config = options.useFactory(...args)

      return {
        ...config,
        exchanges: RmqExchangeUtil.createExchanges(config.exchanges),
      }
    }

    const imports = [
      RabbitMQModule.forRootAsync(RabbitMQModule, {
        imports: options.imports,
        inject: options.inject,
        useFactory: rmqConfigFactory,
      }),
    ];

    const exports: Provider[] = [RabbitMQModule, RmqService];
    const providers: Provider[] =  [RmqService]

    return {
      module: RmqModule,
      providers,
      imports,
      exports,
      global: true,
    };
  }
}
