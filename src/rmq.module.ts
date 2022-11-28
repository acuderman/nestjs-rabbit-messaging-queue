import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import {
  RabbitMQModule,
} from '@golevelup/nestjs-rabbitmq';
import { RmqExchangeUtil } from './rmq-exchange.util';
import { QueueOptions } from './rmq.interfaces';
import { RmqService } from './rmq.service';

@Module({})
export class RmqModule {
  static register(options: QueueOptions): DynamicModule {
    const imports = [
      RabbitMQModule.forRootAsync(RabbitMQModule, {
        imports: [],
        inject: [],
        useFactory: () => {
          return {
            exchanges: RmqExchangeUtil.createExchanges(options.exchanges),
            uri: options.url,
            prefetchCount: options.prefetchCount ?? 100,
            enableControllerDiscovery: true,
            connectionInitOptions: { wait: false },
            logger: new Logger(),
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
