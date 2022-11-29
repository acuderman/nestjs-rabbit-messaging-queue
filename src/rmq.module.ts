import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqExchangeUtil } from './rmq-exchange.util';
import { RmqService } from './rmq.service';
import { RabbitMQModuleConfig } from './rmq.interfaces';

@Module({})
export class RmqModule {
  static register(options: RabbitMQModuleConfig): DynamicModule {
    const imports = [
      RabbitMQModule.forRootAsync(RabbitMQModule, {
        imports: [],
        inject: [],
        useFactory: () => {
          return {
            logger: new Logger(),
            ...options,
            exchanges: RmqExchangeUtil.createExchanges(options.exchanges),
          };
        },
      }),
    ];

    const exports: Provider[] = [RabbitMQModule, RmqService];
    const providers: Provider[] =  [RabbitMQModule, RmqService]

    return {
      module: RmqModule,
      providers,
      imports,
      exports,
      global: true,
    };
  }
}
